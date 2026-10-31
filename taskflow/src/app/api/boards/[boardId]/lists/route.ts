import { NextResponse } from "next/server";
import { createList, listLists } from "@/server/services/list.service";
import { createListSchema } from "@/lib/validations/list.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ boardId: string }> };

/**
 * TaskFlow — Étape 9 · CRUD des colonnes.
 * GET  /api/boards/[boardId]/lists → liste triée (gate board:read)
 * POST /api/boards/[boardId]/lists → création (gate list:create — owner/member)
 */

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const lists = await listLists(boardId); // gate interne : requireBoardAccess
    return NextResponse.json({ lists });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const input = await parseBody(request, createListSchema);
    const list = await createList(boardId, input);
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
