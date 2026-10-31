import { z } from "zod";
import { NextResponse } from "next/server";
import { moveCard } from "@/server/services/card.service";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ cardId: string }> };

/** Voisins calculés côté client (fractional indexing), null = bord de liste. */
const moveCardSchema = z.object({
  toListId: z.string().cuid("Identifiant de colonne invalide"),
  prevOrder: z.number().finite().nullable(),
  nextOrder: z.number().finite().nullable(),
});

/**
 * TaskFlow — Étape 11 · PATCH /api/cards/[cardId]/move
 * Déplacement persistant (même colonne ou colonne cible du même board).
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { cardId } = await params;
    const input = await parseBody(request, moveCardSchema);
    const card = await moveCard(cardId, input);
    return NextResponse.json({ card });
  } catch (error) {
    return jsonError(error);
  }
}
