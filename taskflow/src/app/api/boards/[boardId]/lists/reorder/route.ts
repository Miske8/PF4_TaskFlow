import { NextResponse } from "next/server";
import { reorderLists } from "@/server/services/list.service";
import { reorderListsSchema } from "@/lib/validations/list.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ boardId: string }> };

/**
 * TaskFlow — Étape 9 · persistance du drag & drop des colonnes.
 * PATCH /api/boards/[boardId]/lists/reorder
 * Body : { listIds: string[] } — séquence exhaustive dans le nouvel ordre.
 * Réponse : la liste complète des colonnes avec leurs positions à jour
 * (le client peut réconcilier son cache optimiste sans requête supplémentaire).
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const { listIds } = await parseBody(request, reorderListsSchema);
    const lists = await reorderLists(boardId, listIds);
    return NextResponse.json({ lists });
  } catch (error) {
    return jsonError(error);
  }
}
