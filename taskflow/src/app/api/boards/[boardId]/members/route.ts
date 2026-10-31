import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { requireBoardAccess, requireBoardOwner } from "@/server/auth/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/server/auth/errors";
import { inviteMemberSchema } from "@/lib/validations/member.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ boardId: string }> };

/**
 * GET /api/boards/[boardId]/members — liste des membres (owner ou member).
 * Champs limités : id, name, email, role — rien de plus.
 */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    await requireBoardAccess(boardId, "board:read");
    const members = await db.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ members });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/boards/[boardId]/members — INVITER un membre. OWNER uniquement.
 * Body : { email }
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    await requireBoardOwner(boardId); // ⭐ gate : member → 403

    const { email } = await parseBody(request, inviteMemberSchema);

    const invitee = await db.user.findUnique({ where: { email } });
    if (!invitee) throw new NotFoundError("Aucun compte TaskFlow avec cet email.");

    const existing = await db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: invitee.id } },
    });
    if (existing) throw new ValidationError("Cet utilisateur est déjà membre du tableau.");

    const member = await db.boardMember.create({
      data: { boardId, userId: invitee.id, role: "MEMBER" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/boards/[boardId]/members?userId=X — RETIRER un membre. OWNER uniquement.
 * Un owner ne peut pas être retiré (il faudrait d'abord transférer l'ownership).
 */
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    await requireBoardOwner(boardId); // ⭐ gate owner strict

    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) throw new ValidationError("Paramètre `userId` requis.");

    const target = await db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    if (!target) throw new NotFoundError("Ce membre n'appartient pas au tableau.");
    if (target.role === "OWNER") throw new ForbiddenError("Impossible de retirer le propriétaire.");

    await db.boardMember.delete({ where: { id: target.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
