import { NextResponse } from "next/server";
import { attachLabelToCard } from "@/server/services/label.service";
import { attachLabelSchema } from "@/lib/validations/label.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ cardId: string }> };

/**
 * TaskFlow — Étape 14 · associer un label à une carte.
 * POST /api/cards/[cardId]/labels (gate label:manage via le board parent ;
 * le serveur vérifie que le label appartient au même board que la carte).
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { cardId } = await params;
    const input = await parseBody(request, attachLabelSchema);
    const result = await attachLabelToCard(cardId, input.labelId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
