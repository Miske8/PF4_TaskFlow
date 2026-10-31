import type { Prisma } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { requireBoardAccess, requireListAccess } from "@/server/auth/permissions";
import { NotFoundError, ValidationError } from "@/server/auth/errors";
import { emitBoardEvent } from "@/server/realtime/pusher";
import {
  computeOrder,
  linearizeOrders,
  canInsertBetween,
} from "@/lib/positions";
import type { CreateListInput, RenameListInput } from "@/lib/validations/list.schema";

/**
 * TaskFlow — service List (colonnes) — Étape 9 + Étape 16 (temps réel).
 * Chaque méthode commence par un GATE d'autorisation (requireBoardAccess /
 * requireListAccess) avant tout accès data. Positions = fractional indexing.
 */

/** Board parent d'une liste (avant suppression, quand la ligne n'existe plus). */
async function listBoardId(listId: string): Promise<string | null> {
  const row = await db.list.findUnique({ where: { id: listId }, select: { boardId: true } });
  return row?.boardId ?? null;
}

export const listDtoSelect = {
  id: true,
  title: true,
  order: true,
  boardId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { cards: true } },
} satisfies Prisma.ListSelect;

export type ListDto = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  cardCount: number;
};

function toDto(list: Prisma.ListGetPayload<{ select: typeof listDtoSelect }>): ListDto {
  const { _count, ...rest } = list;
  return { ...rest, cardCount: _count.cards };
}

/** GET : toutes les colonnes d'un board, triées par order asc. */
export async function listLists(boardId: string) {
  await requireBoardAccess(boardId, "board:read");
  const lists = await db.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
    select: listDtoSelect,
  });
  return lists.map(toDto);
}

/**
 * POST : créer une colonne.
 * - par défaut en fin de board (last + GAP),
 * - ou juste après `afterListId` si fourni (midpoint avec le suivant).
 */
export async function createList(boardId: string, input: CreateListInput) {
  const ctx = await requireBoardAccess(boardId, "list:create"); // owner ET member autorisés

  let order: number;

  if (input.afterListId) {
    // La liste de référence doit appartenir au même board (anti injection cross-board).
    const anchor = await db.list.findFirst({
      where: { id: input.afterListId, boardId },
      select: { order: true },
    });
    if (!anchor) throw new ValidationError("Colonne de référence introuvable dans ce tableau.");

    const next = await db.list.findFirst({
      where: { boardId, order: { gt: anchor.order } },
      orderBy: { order: "asc" },
      select: { order: true },
    });
    order = computeOrder({ prev: anchor.order, next: next?.order ?? null });
  } else {
    const last = await db.list.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = computeOrder({ prev: last?.order ?? null, next: null });
  }

  const created = await db.list.create({
    data: { boardId, title: input.title, order },
    select: listDtoSelect,
  });
  void emitBoardEvent(boardId, "list:created", ctx.userId, {
    listId: created.id,
    title: created.title,
  });
  return toDto(created);
}

/** PATCH : renommer (owner ou member). */
export async function renameList(listId: string, input: RenameListInput) {
  const ctx = await requireListAccess(listId, "list:update");
  const updated = await db.list.update({
    where: { id: listId },
    data: { title: input.title },
    select: listDtoSelect,
  });
  void emitBoardEvent(ctx.boardId, "list:updated", ctx.userId, {
    listId,
    title: updated.title,
  });
  return toDto(updated);
}

/**
 * DELETE : supprimer une colonne (owner ou member).
 * Cascade Prisma : List → Card → Comment/CardLabel s'auto-suppriment.
 * ⚠️ On refuse la dernière colonne restante pour garder un board utilisable.
 */
export async function deleteList(listId: string) {
  const ctx = await requireListAccess(listId, "list:delete");

  const remaining = await db.list.count({ where: { boardId: ctx.boardId } });
  if (remaining <= 1) {
    throw new ValidationError("Impossible de supprimer la dernière colonne du tableau.");
  }

  await db.list.delete({ where: { id: listId } });
  void emitBoardEvent(ctx.boardId, "list:deleted", ctx.userId, { listId });
  return { ok: true as const };
}

/**
 * PATCH reorder : persistance du drag & drop des colonnes.
 * Le client envoie la séquence EXHAUSTIVE des ids dans le nouvel ordre ;
 * on vérifie que c'est une permutation exacte des colonnes du board
 * (aucun id inventé / oublié / cross-board), puis on applique :
 *
 *  1. Plan « écriture minimale » (fractional indexing) : si chaque colonne
 *     conserve ses voisins actuels dans la nouvelle séquence, seul l'élément
 *     déplacé change d'order → 1 UPDATE.
 *  2. Sinon (cas multi-onglets / événements concurrents), on relinéarise
 *     toute la séquence demandée en 1×GAP..n×GAP dans une transaction —
 *     garantit un espacement propre et résilient aux égalités.
 */
export async function reorderLists(boardId: string, listIds: string[]) {
  const ctx = await requireBoardAccess(boardId, "list:update");

  const current = await db.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  // Validation : permutation exacte (longueur + ensemble d'ids + pas de doublon).
  if (listIds.length !== current.length) {
    throw new ValidationError(
      "Séquence de colonnes invalide (longueur différente du nombre de colonnes du tableau).",
    );
  }
  const currentIds = new Set(current.map((l) => l.id));
  if (listIds.some((id) => !currentIds.has(id)) || new Set(listIds).size !== listIds.length) {
    throw new ValidationError("Séquence de colonnes invalide (identifiants inconnus ou dupliqués).");
  }

  const byId = new Map(current.map((l) => [l.id, l]));
  const desired = listIds.map((id) => byId.get(id)!); // déjà validé : non-null

  // --- Plan « écriture minimale » : détecte si exactement UN élément a bougé
  // (préfixe et suffixe communs entre les deux séquences). Si oui, on recalcule
  // uniquement son order via midpoint ; sinon on relinéarise tout.
  let prefix = 0;
  while (prefix < desired.length && desired[prefix].id === current[prefix].id) prefix++;
  let suffix = 0;
  while (
    suffix < desired.length - prefix &&
    desired[desired.length - 1 - suffix].id === current[current.length - 1 - suffix].id
  ) suffix++;

  const fromStart = prefix; // fenêtre [prefix .. length-suffix)
  const toEnd = desired.length - suffix;
  const spanLength = toEnd - fromStart;

  const isMinimalPlan = (() => {
    if (spanLength === 0) return true; // no-op : rien n'a changé
    if (spanLength !== 1) return false; // plusieurs éléments ont bougé → relinearize
    const movedId = desired[fromStart].id;
    // L'élément "mobile" doit bien exister dans la fenêtre côté current aussi.
    const currentWindowIds = new Set(current.slice(fromStart, toEnd).map((c) => c.id));
    if (!currentWindowIds.has(movedId)) return false;
    // Le nouveau voisinage doit accepter un midpoint.
    const prev = fromStart > 0 ? desired[fromStart - 1].order : null;
    const next = toEnd < desired.length ? desired[toEnd].order : null;
    if (prev != null && next != null && !canInsertBetween(prev, next)) return false;
    return true;
  })();

  await db.$transaction(async (tx) => {
    if (spanLength === 0) return; // no-op : rien à écrire

    if (isMinimalPlan && spanLength === 1) {
      const prev = fromStart > 0 ? desired[fromStart - 1].order : null;
      const next = toEnd < desired.length ? desired[toEnd].order : null;
      const order = computeOrder({ prev, next });
      await tx.list.update({ where: { id: desired[fromStart].id }, data: { order } });
      return;
    }

    // Re-linéarisation complète dans l'ordre demandé (1×GAP..n×GAP).
    const fresh = linearizeOrders(desired.length);
    for (let i = 0; i < desired.length; i++) {
      if (desired[i].order !== fresh[i]) {
        await tx.list.update({ where: { id: desired[i].id }, data: { order: fresh[i] } });
      }
    }
  });

  // ⏱ Étape 16 : un seul événement agrégé « list:moved » par reorder ;
  // le client relit la séquence complète depuis l'API (source de vérité).
  void emitBoardEvent(boardId, "list:moved", ctx.userId, { listId: listIds[0] ?? "" });

  return listLists(boardId);
}

/** Renvoie une colonne seule (après mutation unitaire) avec gate lecture. */
export async function getList(listId: string): Promise<ListDto> {
  const { list } = await requireListAccess(listId, "board:read");
  const full = await db.list.findUnique({ where: { id: list.id }, select: listDtoSelect });
  if (!full) throw new NotFoundError();
  return toDto(full);
}
