import { NextResponse } from "next/server";
import { createCard } from "@/server/services/card.service";
import { createCardSchema } from "@/lib/validations/card.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ listId: string }> };

/**
 * TaskFlow — Étape 10 · POST /api/lists/[listId]/cards
 * Créer une carte en fin de colonne (gate card:create via le board parent).
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { listId } = await params;
    const input = await parseBody(request, createCardSchema);
    const card = await createCard(listId, input);
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
