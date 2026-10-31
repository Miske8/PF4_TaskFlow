import jwt from "next-auth/jwt";
import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { canAccessBoardChannel } from "@/server/realtime/channels";
import { jsonError } from "@/lib/api";

/**
 * TaskFlow — Étape 16 · autorisation des canaux PRIVÉS Pusher.
 * POST /api/pusher/auth
 *
 * Pusher appelle ce endpoint (via `authorizer` côté client, cookie session
 * inclus) AVANT d'autoriser un abonnement à un canal `private-*`.
 * Règle stricte : seul un owner ou un membre du board peut s'abonner au
 * canal `private-board-{boardId}` ; tout autre nom de canal est refusé.
 *
 * ⚠️ Le secret Pusher n'est jamais utilisé ici : la signature du token de
 * channel est produite par Pusher Channels à partir du `socket_id` reçu et
 * du secret SERVEUR (`PUSHER_SECRET`), côté SDK serveur uniquement.
 */
export async function POST(request: Request) {
  try {
    // 1. Identité : décryptage direct du JWT Auth.js (aucune dépendance
    //    Prisma/Node → handler compatible edge/runtime standard).
    const token = await jwt.getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    const userId = token?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // 2. Demande d'abonnement envoyée par Pusher.
    const body = (await request.json()) as {
      socket_id?: string;
      channel_name?: string;
    };
    const { socket_id, channel_name } = body;
    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    // 3. Autorisation métier : membre du board ? (default deny sinon)
    const allowed = await canAccessBoardChannel(userId, channel_name, async (uid, boardId) => {
      const board = await db.board.findUnique({
        where: { id: boardId },
        select: {
          ownerId: true,
          members: { where: { userId: uid }, select: { role: true } },
        },
      });
      if (!board) return false;
      return board.ownerId === uid || board.members.length > 0;
    });
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé à ce canal." }, { status: 403 });
    }

    // 4. Signature via le SDK serveur (nécessite PUSHER_SECRET côté serveur).
    //    Non configuré (dev local sans Pusher) → 503 explicite.
    const { getPusherServer } = await import("@/server/realtime/pusher");
    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json({ error: "Temps réel non configuré." }, { status: 503 });
    }

    const auth = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: userId,
    });
    return NextResponse.json(auth);
  } catch (error) {
    return jsonError(error);
  }
}
