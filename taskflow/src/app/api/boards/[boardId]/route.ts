import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { requireBoardAccess, requireBoardOwner } from "@/server/auth/permissions";
import { updateBoard, deleteBoard } from "@/server/services/board.service";
import { updateBoardSchema } from "@/lib/validations/board.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ boardId: string }> };

/**
 * GET /api/boards/[boardId] — détail complet du board.
 * Gate : `board:read` → seul owner/member y accède ; un extérieur reçoit 403.
 */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    await requireBoardAccess(boardId, "board:read"); // ⭐ autorisation AVANT data

    const board = await db.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        lists: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { order: "asc" },
              include: { labels: { include: { label: true } }, _count: { select: { comments: true } } },
            },
          },
        },
        labels: true,
      },
    });
    if (!board) throw new Error("not found"); // requireBoardAccess a déjà garanti l'existence
    return NextResponse.json({ board });
  } catch (error) {
    return jsonError(error);
  }
}

/** PATCH /api/boards/[boardId] — membre ou owner (renommage, archive). */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const input = await parseBody(request, updateBoardSchema);
    const board = await updateBoard(boardId, input); // gate interne: board:update
    return NextResponse.json({ board });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/boards/[boardId] — OWNER uniquement (403 pour un member). */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    await requireBoardOwner(boardId); // gate explicite doublé par le service
    await deleteBoard(boardId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
