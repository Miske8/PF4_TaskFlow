import { NextResponse } from "next/server";
import { renameList, deleteList } from "@/server/services/list.service";
import { renameListSchema } from "@/lib/validations/list.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ listId: string }> };

/**
 * TaskFlow — Étape 9 · colonne unitaire.
 * PATCH  /api/lists/[listId] → renommer (gate list:update)
 * DELETE /api/lists/[listId] → supprimer + cascade cartes (gate list:delete)
 */

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { listId } = await params;
    const input = await parseBody(request, renameListSchema);
    const list = await renameList(listId, input);
    return NextResponse.json({ list });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { listId } = await params;
    const result = await deleteList(listId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
