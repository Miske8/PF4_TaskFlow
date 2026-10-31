/**
 * TaskFlow — test d'intégration du service List (Étape 9).
 * Exécute la vraie logique métier (positions, permutation exacte, gates)
 * contre PostgreSQL en simulant la session via requireBoardAccess mockée.
 * Lancé manuellement : npx vitest run src/tests/list.service.integration.test.ts
 * (skip si DATABASE_URL absente pour garder la suite CI-safe).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const hasDb = !!process.env.DATABASE_URL;

vi.mock("@/server/auth/permissions", () => ({
  // Gate neutralisé : on teste ICI la logique de positions, pas l'RBAC
  // (couvert unitairement par permissions.test.ts + étape 5).
  requireBoardAccess: vi.fn(async () => ({ userId: "u1", boardId: "", role: "OWNER" })),
  requireListAccess: vi.fn(async (_id: string) => ({ list: { id: _id, boardId: "" }, userId: "u1", boardId: "", role: "OWNER" })),
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

describe.skipIf(!hasDb)("list.service — intégrité des positions (PostgreSQL)", () => {
  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `lists-${Date.now()}@taskflow.dev`, name: "Test Lists", passwordHash: "x" },
    });
    const board = await db.board.create({
      data: { name: "Board lists test", ownerId: user.id, members: { create: { userId: user.id, role: "OWNER" } } },
    });
    boardId = board.id;
  });

  afterAll(async () => {
    await db.board.deleteMany({ where: { id: boardId } });
    await db.user.deleteMany({ where: { email: { startsWith: `lists-${""}` }, name: "Test Lists" } }).catch(() => {});
  });

  it("crée des colonnes avec des orders strictement croissants", async () => {
    const a = await createList(boardId, { title: "A" });
    const b = await createList(boardId, { title: "B" });
    const c = await createList(boardId, { title: "C" });
    expect(b.order).toBeGreaterThan(a.order);
    expect(c.order).toBeGreaterThan(b.order);

    // Insertion relative : entre A et B → midpoint exact
    const mid = await createList(boardId, { title: "A-B", afterListId: a.id });
    expect(mid.order).toBeGreaterThan(a.order);
    expect(mid.order).toBeLessThan(b.order);
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
    // Orders proprement linéarisés : GAP, 2*GAP, ...
    expect(after[0].order).not.toBeGreaterThanOrEqual(after[1].order);
    for (let i = 1; i < after.length; i++) {
      expect(after[i].order).toBeGreaterThan(after[i - 1].order);
    }
  });

  it("refuse une séquence invalide (id inventé ou doublon)", async () => {
    const lists = await listLists(boardId);
    const ids = lists.map((l) => l.id);
    await expect(
      reorderLists(boardId, [...ids.slice(0, -1), "ckyl9p6qj000008z9zzzzzzzz"]),
    ).rejects.toThrow(/invalide/);
    await expect(reorderLists(boardId, [...ids, ids[0]])).rejects.toThrow(/invalide/);
  });

  it("écriture minimale : un seul UPDATE quand un élément change de place", async () => {
    const lists = await listLists(boardId);
    if (lists.length < 3) return;
    const before = new Map(lists.map((l) => [l.id, l.order]));
    // Déplacer le premier en toute fin : seul cet élément change d'order
    const seq = [...lists.slice(1).map((l) => l.id), lists[0].id];
    const after = await reorderLists(boardId, seq);
    let changed = 0;
    for (const l of after) if (before.get(l.id) !== l.order) changed++;
    expect(changed).toBe(1); // écriture minimale garantie par le plan midpoint
  });

  it("supprime une colonne et refuse la suppression de la dernière", async () => {
    const lists = await listLists(boardId);
    await deleteList(lists[lists.length - 1].id);
    const remaining = await listLists(boardId);
    expect(remaining.length).toBe(lists.length - 1);

    // Ne laisser qu'une colonne puis tenter de la supprimer → ValidationError
    while ((await listLists(boardId)).length > 1) {
      const ls = await listLists(boardId);
      await deleteList(ls[ls.length - 1].id);
    }
    const last = (await listLists(boardId))[0];
    await expect(deleteList(last.id)).rejects.toThrow(/dernière colonne/);
  });

  it("la suppression en cascade retire bien les cartes", async () => {
    const list = (await listLists(boardId))[0];
    await db.card.create({ data: { listId: list.id, title: "Carte à cascader", order: 1000 } });
    await deleteList(list.id);
    const orphans = await db.card.count({ where: { listId: list.id } });
    expect(orphans).toBe(0);
  });


it("la suppression en cascade retire bien les cartes", async () => {
    const list = (await listLists(boardId))[0];
    await db.card.create({ data: { listId: list.id, title: "Carte à cascader", order: 1000 } });
    await deleteList(list.id);
    const orphans = await db.card.count({ where: { listId: list.id } });
    expect(orphans).toBe(0);
  });
});
