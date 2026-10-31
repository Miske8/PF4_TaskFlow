import type { BoardRole, Prisma } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { auth } from "@/server/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/server/auth/errors";
import { can, type BoardAction } from "@/lib/permissions";

/**
 * TaskFlow — couche d'autorisation SERVEUR (la seule source de vérité).
 *
 * ⚠️ Principe : AUCUNE route API / Server Action ne touche Prisma sans passer
 * par un helper de ce fichier. Une requête sur une ressource doit être
 * résolue → puis autorisée → puis mutée. Jamais l'inverse.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

/** Utilisateur courant ou `null` (composants qui adaptent l'affichage). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}

/** Exige une session valide, sinon 401 (converti en HTTP par les routes). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Simple raccourci id (le plus utilisé dans les services). */
export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

/* ------------------------------------------------------------------ */
/* Rôle sur un board                                                   */
/* ------------------------------------------------------------------ */

/**
 * Résout le rôle effectif d'un utilisateur sur un board :
 *  - "OWNER" si c'est son board (colonne ownerId),
 *  - "MEMBER" s'il a une ligne BoardMember,
 *  - null sinon (extérieur → jamais de fuite de données).
 * Une seule requête indexée ; renvoie aussi le board pour éviter un second aller-retour.
 */
async function resolveBoardAccess(
  userId: string,
  boardId: string,
): Promise<{ role: BoardRole | null; board: { id: string; ownerId: string } | null }> {
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { id: true, ownerId: true, members: { where: { userId }, select: { role: true } } },
  });
  if (!board) return { role: null, board: null };
  if (board.ownerId === userId) return { role: "OWNER", board };
  return { role: board.members[0]?.role ?? null, board };
}

/** Membre (owner inclus) ? → false pour un extérieur. */
export async function isBoardMember(userId: string, boardId: string): Promise<boolean> {
  const { role } = await resolveBoardAccess(userId, boardId);
  return role !== null;
}

/** Owner uniquement (suppression de board, gestion des membres). */
export async function isBoardOwner(userId: string, boardId: string): Promise<boolean> {
  const { role } = await resolveBoardAccess(userId, boardId);
  return role === "OWNER";
}

/* ------------------------------------------------------------------ */
/* Helpers « require » : autorisation + retour de contexte             */
/* ------------------------------------------------------------------ */

export interface BoardAccessContext {
  userId: string;
  boardId: string;
  role: BoardRole;
}

/**
 * GATE principal : vérifie que l'utilisateur courant peut effectuer `action`
 * sur `boardId`. Lève 401 (pas connecté), 403 (non membre / rôle insuffisant)
 * ou 404 si le board n'existe pas.
 *
 * NB : on renvoie 403 et non 404 pour un board existant mais privé, afin de
 * ne pas révéler davantage ; l'UI traite les deux comme « accès refusé ».
 */
export async function requireBoardAccess(
  boardId: string,
  action: BoardAction,
): Promise<BoardAccessContext> {
  const user = await requireUser();
  const { role, board } = await resolveBoardAccess(user.id, boardId);

  if (!board) throw new ForbiddenError("Tableau introuvable ou accès refusé.");
  if (!can(role, action)) {
    throw new ForbiddenError("Vous n'avez pas les droits requis sur ce tableau.");
  }
  return { userId: user.id, boardId: board.id, role: role! };
}

/** Équivalent strict « owner only » (delete board, invite/remove member). */
export async function requireBoardOwner(boardId: string): Promise<BoardAccessContext> {
  return requireBoardAccess(boardId, "board:delete"); // seul OWNER possède board:delete
}

/* ------------------------------------------------------------------ */
/* Ressources enfants : liste / carte                                  */
/* ------------------------------------------------------------------ */

const listBoardSelect = { id: true, boardId: true } satisfies Prisma.ListSelect;
const cardBoardSelect = {
  id: true,
  listId: true,
  list: { select: { id: true, boardId: true } },
} satisfies Prisma.CardSelect;

/** La liste appartient-elle à un board accessible ? Retourne la liste + accès. */
export async function requireListAccess(listId: string, action: BoardAction) {
  const list = await db.list.findUnique({ where: { id: listId }, select: listBoardSelect });
  if (!list) throw new ForbiddenError("Liste introuvable ou accès refusé.");
  const ctx = await requireBoardAccess(list.boardId, action);
  return { list, ...ctx };
}

/** Idem pour une carte (remonte via list → board). */
export async function requireCardAccess(cardId: string, action: BoardAction) {
  const card = await db.card.findUnique({ where: { id: cardId }, select: cardBoardSelect });
  if (!card) throw new ForbiddenError("Carte introuvable ou accès refusé.");
  const ctx = await requireBoardAccess(card.list.boardId, action);
  return { card, ...ctx };
}
