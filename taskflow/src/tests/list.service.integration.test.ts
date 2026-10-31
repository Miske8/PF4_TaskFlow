/**
 * TaskFlow — test d'intégration du service List (Étapes 9 & 19).
 * Exécute la vraie logique métier (positions, permutation exacte, gates)
 * contre PostgreSQL en simulant la session via requireBoardAccess mockée.
 *
 * Isolation (correction Étape 19) : un board FRAIS est créé dans
 * `beforeEach` et détruit dans `afterEach` — chaque test part donc d'un
 * board vide, ce qui rend les scénics déterministes et indépendants de
 * l'état résiduel de la base (les runs précédents pouvaient laisser des
 * colonnes et faussernt les compteurs → « dernière colonne » etc.).
 * Skip automatique si DATABASE_URL est absente (suite CI-safe).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hasDb = !!process.env.DATABASE_URL;

vi.mock("@/server/auth/permissions", () => ({
  // Gate neutralisé : on teste ICI la logique de positions, pas le RBAC
  // (couvert unitairement par permissions.test.ts + étape 5).
  // requireListAccess renvoie le VRAI boardId de la colonne pour que les
  // compteurs métier (règle « dernière colonne ») soient exacts.
  requireBoardAccess: vi.fn(async (_boardId: string) => ({ userId: "u1", boardId: _boardId ?? "", role: "OWNER" })),
  requireListAccess: vi.fn(async (id: string) => {
    const { db } = await import("@/server/db/prisma");
    const row = await db.list.findUnique({ where: { id }, select: { boardId: true } });
    return { list: { id, boardId: row?.boardId ?? "" }, userId: "u1", boardId: row?.boardId ?? "", role: "OWNER" };
  }),
}));

import { db } from "@/server/db/prisma";
import {
  createList,
  deleteList,
  listLists,
  renameList,
  reorderLists,
} from "@/server/services/list.service";

let boardId: string;
let userId: string;

describe.skipIf(!hasDb)("list.service — intégrité des positions (PostgreSQL)", () => {
  beforeEach(async () => {
    const user = await db.user.create({
      data: { email: `lists-${Date.now()}-${Math.random().toString(36).slice(2)}@taskflow.dev`, name: "Test Lists", passwordHash: "x" },
    });
    userId = user.id;
    const board = await db.board.create({
      data: { name: "Board lists test", ownerId: user.id, members: { create: { userId: user.id, role: "OWNER" } } },
    });
    boardId = board.id;
    // Board non vide dès le départ : la règle métier interdit de vider
    // entièrement un board ; les tests qui créent/renomment/ordonnent sont
    // ainsi autonomes et déterministes.
    await db.list.createMany({
      data: [
        { boardId, title: "Colonne 1", order: 1000 },
        { boardId, title: "Colonne 2", order: 2000 },
      ],
    });
  });

  afterEach(async () => {
    // Cascade DB (board → lists → cards…) + suppression de l'utilisateur de test.
    await db.board.deleteMany({ where: { id: boardId } });
    await db.user.deleteMany({ where: { id: userId } });
  });

  it("crée des colonnes avec des orders strictement croissants", async () => {
    const before = (await listLists(boardId)).map((l) => l.order);
    const a = await createList(boardId, { title: "A" });
    const b = await createList(boardId, { title: "B" });
    const c = await createList(boardId, { title: "C" });
    // ajout en fin de liste : orders strictement croissants après l'existant
    expect(a.order).toBeGreaterThan(before[before.length - 1]);
    expect(b.order).toBeGreaterThan(a.order);
    expect(c.order).toBeGreaterThan(b.order);

    // Insertion relative : après la première colonne existante → midpoint
    const first = (await listLists(boardId))[0];
    const second = (await listLists(boardId))[1];
    const mid = await createList(boardId, { title: "A-B", afterListId: first.id });
    expect(mid.order).toBeGreaterThan(first.order);
    expect(mid.order).toBeLessThan(second.order);
  });

  it("renomme une colonne", async () => {
    const [first] = await listLists(boardId);
    const updated = await renameList(first.id, { title: "Renommée" });
    expect(updated.title).toBe("Renommée");
  });

  it("réordonne par permutation complète (relinearization) et persiste", async () => {
    const lists = await listLists(boardId);
    const reversed = [...lists].reverse().map((l) => l.id);
    const after = await reorderLists(boardId, reversed);
    expect(after.map((l) => l.id)).toEqual(reversed);
    // Orders strictement croissants dans le nouvel ordre d'affichage
    for (let i = 1; i < after.length; i++) {
      expect(after[i].order).toBeGreaterThan(after[i - 1].order);
    }
  });

  it("refuse une séquence invalide (id inventé ou doublon)", async () => {
    const lists = await listLists(boardId);
    const ids = lists.map((l) => l.id);
    await expect(
      reorderLists(boardId, [...ids.slice(0, -1), "ckyl9p6qj000008z9abcdefghij"]),
    ).rejects.toThrow(/invalide/);
    await expect(reorderLists(boardId, [...ids, ids[0]])).rejects.toThrow(/invalide/);
  });

  it("déplacement réel (milieu → fin) : écriture minimale ou relinéarisation cohérente", async () => {
    // Scénario dnd-kit typique : une colonne insérée entre deux voisines,
    // puis déplacée juste avant la dernière. Selon l'état des orders en base
    // (le service peut avoir relinéarisé à l'insertion), soit le plan
    // midpoint s'applique (1 UPDATE), soit une relinéarisation propre a lieu.
    // Dans les deux cas : invariant d'ordre strictement croissant + position
    // de la colonne déplacée correcte — c'est ce qui compte pour la persistance.
    const anchor = await createList(boardId, { title: "Finale" });
    const moved = await createList(boardId, { title: "À déplacer", afterListId: anchor.id });
    await createList(boardId, { title: "Après" });

    const lists = await listLists(boardId); // état courant EN BASE (référence)
    const before = new Map(lists.map((l) => [l.id, l.order]));
    const lastId = lists[lists.length - 1].id;

    const seq = lists.map((l) => l.id).filter((id) => id !== moved.id);
    seq.splice(seq.indexOf(lastId), 0, moved.id); // ...moved, last...
    const after = await reorderLists(boardId, seq);

    let changed = 0;
    for (const l of after) if (before.get(l.id) !== l.order) changed++;
    expect(changed).toBeGreaterThanOrEqual(1); // au moins l'élément bougé change

    // Invariant : orders strictement croissants dans l'ordre retourné
    for (let i = 1; i < after.length; i++) {
      expect(after[i].order).toBeGreaterThan(after[i - 1].order);
    }
    // La colonne déplacée est bien entre son nouveau voisin de gauche et last
    const idxMoved = after.findIndex((l) => l.id === moved.id);
    expect(after[idxMoved + 1].id).toBe(lastId);
    expect(after[idxMoved].order).toBeLessThan(after[idxMoved + 1].order);
  });

  it("relinearization complète quand plusieurs colonnes changent de voisins", async () => {
    // Déplacer le premier en toute fin ⇒ les autres perdent leur voisin de
    // gauche ⇒ le service relinéarise tout en GAP..n×GAP (cas multi-onglets).
    const lists = await listLists(boardId);
    const seq = [...lists.slice(1).map((l) => l.id), lists[0].id];
    const after = await reorderLists(boardId, seq);
    const orders = after.map((l) => l.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    }
  });

  it("supprime une colonne et refuse la suppression de la dernière", async () => {
    const lists = await listLists(boardId);
    const extra = await createList(boardId, { title: "Temporaire" });
    await deleteList(extra.id);
    const remaining = await listLists(boardId);
    expect(remaining.length).toBe(lists.length); // créée puis supprimée

    // Vider le board jusqu'à la dernière colonne → ValidationError
    let ls = await listLists(boardId);
    while (ls.length > 1) {
      await deleteList(ls[ls.length - 1].id);
      ls = await listLists(boardId);
    }
    await expect(deleteList(ls[0].id)).rejects.toThrow(/dernière colonne/);
  });

  it("la suppression en cascade retire bien les cartes", async () => {
    // Board frais (beforeEach) → on crée deux colonnes pour ne pas heurter
    // la règle métier « impossible de supprimer la dernière colonne ».
    await createList(boardId, { title: "Gardée" });
    const doomed = await createList(boardId, { title: "À supprimer" });
    await db.card.create({ data: { listId: doomed.id, title: "Carte à cascader", order: 1000 } });

    await deleteList(doomed.id);

    const orphans = await db.card.count({ where: { listId: doomed.id } });
    expect(orphans).toBe(0);
  });
});
