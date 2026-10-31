import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/server/auth/permissions";
import { createBoard, listAccessibleBoards } from "@/server/services/board.service";
import { createBoardSchema } from "@/lib/validations/board.schema";
import { jsonError, parseBody } from "@/lib/api";

/** GET /api/boards — liste des boards accessibles (owner + member). */
export async function GET() {
  try {
    const userId = await requireUserId(); // 401 si pas de session
    const boards = await listAccessibleBoards(userId);
    return NextResponse.json({ boards });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/boards — création ; l'utilisateur devient OWNER. */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = await parseBody(request, createBoardSchema);
    const board = await createBoard(userId, input);
    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

// Re-export utilitaire pour les tests d'API éventuels (schéma de query string).
export const boardsQuerySchema = z.object({ archived: z.coerce.boolean().optional() });
