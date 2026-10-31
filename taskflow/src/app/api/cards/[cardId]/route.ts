import { NextResponse } from "next/server";
import { getCard, updateCard, deleteCard } from "@/server/services/card.service";
import { updateCardSchema } from "@/lib/validations/card.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ cardId: string }> };

/**
 * TaskFlow — Étape 10/14 · carte unitaire.
 * GET    /api/cards/[cardId] → détail (labels inclus) — gate board:read
 * PATCH  /api/cards/[cardId] → titre/description/échéance/terminé — gate card:update
 * DELETE /api/cards/[cardId] → suppression (+ cascade) — gate card:delete
 */

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { cardId } = await params;
    const card = await getCard(cardId);
    return NextResponse.json({ card });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { cardId } = await params;
    const input = await parseBody(request, updateCardSchema);
    const card = await updateCard(cardId, input);
    return NextResponse.json({ card });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { cardId } = await params;
    const result = await deleteCard(cardId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
