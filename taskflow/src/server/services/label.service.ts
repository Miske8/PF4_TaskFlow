import type { LabelColor } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { requireBoardAccess, requireCardAccess } from "@/server/auth/permissions";
import { ValidationError } from "@/server/auth/errors";
import type { CreateLabelInput } from "@/lib/validations/label.schema";

/**
 * TaskFlow — service Label — Étape 14.
 * Labels scopés au board (unicité du nom par board) + associations N:N cartes.
 */

export const labelDtoSelect = {
  id: true,
  name: true,
  color: true,
  boardId: true,
} satisfies Prisma.LabelSelect;

export type LabelDto = {
  id: string;
  name: string;
  color: string;
  boardId: string;
};

/** GET : palette des labels d'un board (triées par nom). */
export async function listLabels(boardId: string) {
  await requireBoardAccess(boardId, "board:read");
  return db.label.findMany({
    where: { boardId },
    orderBy: { name: "asc" },
    select: labelDtoSelect,
  });
}

/** POST /api/boards/[boardId]/labels — créer un label (owner ou member). */
export async function createLabel(boardId: string, input: CreateLabelInput) {
  const ctx = await requireBoardAccess(boardId, "label:manage");

  const existing = await db.label.findUnique({
    where: { boardId_name: { boardId, name: input.name } },
    select: { id: true },
  });
  if (existing) {
    throw new ValidationError("Un label porte déjà ce nom dans ce tableau.", {
      name: ["Nom déjà utilisé dans ce tableau."],
    });
  }

  try {
    return await db.label.create({
      data: {
        boardId,
        name: input.name,
        color: input.color as LabelColor,
        createdByUserId: ctx.userId,
      },
      select: labelDtoSelect,
    });
  } catch (error) {
    // Course possible entre deux membres : l'unique (boardId,name) protège.
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new ValidationError("Un label porte déjà ce nom dans ce tableau.");
    }
    throw error;
  }
}

/**
 * POST /api/cards/[cardId]/labels — attacher un label à une carte.
 * ⚠️ Le label DOIT appartenir au même board que la carte (anti cross-board),
 * sinon 422. L'association est idempotente (PK composite CardLabel).
 */
export async function attachLabelToCard(cardId: string, labelId: string) {
  const { card } = await requireCardAccess(cardId, "label:manage");

  const label = await db.label.findFirst({
    where: { id: labelId },
    select: { id: true, boardId: true },
  });
  if (!label || label.boardId !== card.list.boardId) {
    throw new ValidationError("Ce label n'appartient pas au tableau de la carte.");
  }

  await db.cardLabel.upsert({
    where: { cardId_labelId: { cardId, labelId } },
    create: { cardId, labelId },
    update: {},
  });

  return { ok: true as const };
}

/** DELETE /api/cards/[cardId]/labels/[labelId] — détacher (idempotent). */
export async function detachLabelFromCard(cardId: string, labelId: string) {
  await requireCardAccess(cardId, "label:manage");
  await db.cardLabel.deleteMany({ where: { cardId, labelId } });
  return { ok: true as const };
}
