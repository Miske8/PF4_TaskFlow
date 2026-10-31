import { NextResponse } from "next/server";
import { detachLabelFromCard } from "@/server/services/label.service";
import { jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ cardId: string; labelId: string }> };

/**
 * TaskFlow — Étape 14 · retirer un label d'une carte (idempotent).
 * DELETE /api/cards/[cardId]/labels/[labelId]
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { cardId, labelId } = await params;
    const result = await detachLabelFromCard(cardId, labelId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
