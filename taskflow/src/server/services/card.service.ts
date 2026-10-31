import type { Prisma } from "@prisma/client";
import { db } from "@/server/db/prisma";
import {
  requireBoardAccess,
  requireCardAccess,
  requireListAccess,
} from "@/server/auth/permissions";
import { ValidationError } from "@/server/auth/errors";
import { computeOrder } from "@/lib/positions";
import { emitBoardEvent } from "@/server/realtime/pusher";
import type { CreateCardInput, UpdateCardInput } from "@/lib/validations/card.schema";

/**
 * TaskFlow — service Card — Étape 10 (CRUD) + Étape 14 (labels & échéance)
 * + Étape 16 (émission temps réel après chaque mutation réussie).
 * Chaque méthode : GATE d'autorisation (via le board parent) → validation → data → event.
 */

/** Résout le board parent d'une carte (utilitaire — les services utilisent
 *  préférentiellement requireCardAccess qui remonte déjà list → board). */
export async function cardBoardId(cardId: string): Promise<string | null> {
  const row = await db.card.findUnique({
    where: { id: cardId },
    select: { list: { select: { boardId: true } } },
  });
  return row?.list.boardId ?? null;
}

/* ------------------------------------------------------------------ */
/* DTO                                                                 */
/* ------------------------------------------------------------------ */

export const cardDtoSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  completedAt: true,
  order: true,
  listId: true,
  createdAt: true,
  updatedAt: true,
  labels: {
    select: {
      label: { select: { id: true, name: true, color: true } },
    },
  },
} satisfies Prisma.CardSelect;

export type CardLabelDto = { id: string; name: string; color: string };

export type CardDto = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  order: number;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
  labels: CardLabelDto[];
};

function toDto(card: Prisma.CardGetPayload<{ select: typeof cardDtoSelect }>): CardDto {
  return {
    ...card,
    labels: card.labels.map((cl) => cl.label),
  };
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

/** POST /api/lists/[listId]/cards — créer une carte en fin de colonne. */
export async function createCard(listId: string, input: CreateCardInput) {
  const ctx = await requireListAccess(listId, "card:create"); // owner ET member

  const last = await db.card.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = computeOrder({ prev: last?.order ?? null, next: null });

  const created = await db.card.create({
    data: { listId, title: input.title, order },
    select: cardDtoSelect,
  });
  // ⏱ Étape 16 : temps réel best-effort (no-op si Pusher non configuré).
  void emitBoardEvent(ctx.boardId, "card:created", ctx.userId, {
    cardId: created.id,
    listId,
    title: created.title,
  });
  return toDto(created);
}

/** GET /api/cards/[cardId] — détail (utilisé par la modal de l'étape 13). */
export async function getCard(cardId: string) {
  await requireCardAccess(cardId, "board:read");
  const card = await db.card.findUnique({ where: { id: cardId }, select: cardDtoSelect });
  if (!card) throw new ValidationError("Carte introuvable.");
  return toDto(card);
}

/**
 * PATCH /api/cards/[cardId] — titre / description / échéance / terminé.
 * `dueDate`/`completedAt` reçoivent des chaînes ISO depuis l'API ; on les
 * convertit ici (null = retirer). Bascule « terminée » : completedAt non nul.
 */
export async function updateCard(cardId: string, input: UpdateCardInput) {
  const ctx = await requireCardAccess(cardId, "card:update");

  const data: Prisma.CardUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.completedAt !== undefined) {
    data.completedAt = input.completedAt ? new Date(input.completedAt) : null;
  }

  const updated = await db.card.update({ where: { id: cardId }, data, select: cardDtoSelect });
  void emitBoardEvent(ctx.boardId, "card:updated", ctx.userId, {
    cardId,
    listId: updated.listId,
  });
  return toDto(updated);
}

/** DELETE /api/cards/[cardId] — cascade automatique commentaires/labels. */
export async function deleteCard(cardId: string) {
  const ctx = await requireCardAccess(cardId, "card:delete");
  const boardId = ctx.card.list.boardId;
  const listId = ctx.card.list.id;
  await db.card.delete({ where: { id: cardId } });
  void emitBoardEvent(boardId, "card:deleted", ctx.userId, { cardId, listId });
  return { ok: true as const };
}

/* ------------------------------------------------------------------ */
/* Déplacement (drag & drop — étapes 11/12)                            */
/* ------------------------------------------------------------------ */

const cardBoardSelect = {
  id: true,
  listId: true,
  list: { select: { boardId: true } },
} satisfies Prisma.CardSelect;

/**
 * PATCH /api/cards/[cardId]/move — déplacer une carte (même colonne ou
 * colonne cible du même board). `prevOrder`/`nextOrder` sont les voisins
 * calculés côté client (fractional indexing) ; le serveur re-vérifie que
 * la liste cible appartient bien au même board (anti cross-board).
 */
export async function moveCard(
  cardId: string,
  input: { toListId: string; prevOrder: number | null; nextOrder: number | null },
) {
  const card = await db.card.findUnique({ where: { id: cardId }, select: cardBoardSelect });
  if (!card) throw new ValidationError("Carte introuvable.");
  const fromListId = card.listId;
  // GATE d'autorisation sur le board parent + résolution du board source.
  const ctx = await requireBoardAccess(card.list.boardId, "card:update");

  const target = await db.list.findFirst({
    where: { id: input.toListId, boardId: card.list.boardId },
    select: { id: true },
  });
  if (!target) throw new ValidationError("Colonne de destination invalide.");

  const order = computeOrder({ prev: input.prevOrder, next: input.nextOrder });
  const updated = await db.card.update({
    where: { id: cardId },
    data: { listId: input.toListId, order },
    select: cardDtoSelect,
  });
  void emitBoardEvent(ctx.boardId, "card:moved", ctx.userId, {
    cardId,
    fromListId,
    toListId: input.toListId,
  });
  return toDto(updated);
}
