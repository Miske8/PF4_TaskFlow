import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { requireBoardAccess } from "@/server/auth/permissions";
import { ForbiddenError } from "@/server/auth/errors";
import { jsonError } from "@/lib/api";

/**
 * TaskFlow — POST /api/boards/[boardId]/leave
 * Un MEMBER peut quitter un tableau dont il n'est pas owner.
 * (L'owner doit transférer l'ownership ou supprimer le board — défendu ici.)
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;
    const ctx = await requireBoardAccess(boardId, "board:read");

    if (ctx.role === "OWNER") {
      throw new ForbiddenError("Le propriétaire ne peut pas quitter son propre tableau.");
    }

    await db.boardMember.deleteMany({ where: { boardId, userId: ctx.userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
