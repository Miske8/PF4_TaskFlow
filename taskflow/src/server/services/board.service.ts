import { db } from "@/server/db/prisma";
import { requireBoardAccess, requireBoardOwner } from "@/server/auth/permissions";
import { NotFoundError } from "@/server/auth/errors";
import type { CreateBoardInput, UpdateBoardInput } from "@/lib/validations/board.schema";

/**
 * TaskFlow — service Board (logique métier pure, chaque méthode commence
 * par un GATE d'autorisation avant tout accès data).
 */

/** Tous les boards accessibles (owner OU membre), tri récents d'abord. */
export async function listAccessibleBoards(userId: string) {
  return db.board.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      isArchived: false,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      isArchived: true,
      updatedAt: true,
      ownerId: true,
      // Rôle de l'utilisateur sur ce board (OWNER via la membership créée à la création).
      members: { where: { userId }, select: { role: true } },
      _count: { select: { lists: true } },
    },
  }).then((boards) =>
    boards.map(({ members, _count, ...board }) => ({
      ...board,
      role: members[0]?.role ?? null,
      listCount: _count.lists,
    })),
  );
}

export async function createBoard(userId: string, input: CreateBoardInput) {
  // Création : pas de board existant à autoriser ; l'utilisateur devient owner.
  return db.board.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      ownerId: userId,
      // L'owner est aussi présent dans members pour simplifier les requêtes "mes boards".
      members: { create: { userId, role: "OWNER" } },
      // Une colonne par défaut pour un board immédiatement utilisable.
      lists: { create: { title: "À faire", order: 1000 } },
    },
    select: { id: true, name: true, description: true, ownerId: true, updatedAt: true },
  });
}

/** PATCH : n'importe quel membre peut renommer/archiver (règle produit retenue). */
export async function updateBoard(boardId: string, input: UpdateBoardInput) {
  await requireBoardAccess(boardId, "board:update"); // 401/403 si non autorisé
  const updated = await db.board.update({
    where: { id: boardId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
    },
    select: { id: true, name: true, description: true, isArchived: true, updatedAt: true },
  });
  if (!updated) throw new NotFoundError();
  return updated;
}

/** DELETE : OWNER uniquement — `requireBoardOwner` lève 403 pour un member. */
export async function deleteBoard(boardId: string) {
  await requireBoardOwner(boardId); // gate strict
  // Cascade Prisma : lists → cards → comments/card_labels s'auto-suppriment.
  await db.board.delete({ where: { id: boardId } });
  return { ok: true as const };
}
