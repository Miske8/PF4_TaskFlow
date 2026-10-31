/**
 * TaskFlow — types partagés client/serveur (DTO des routes API).
 * Inférés depuis les schémas Zod quand c'est pertinent ; sinon déclarés ici
 * pour rester la source unique de vérité des payloads JSON.
 */

import type { BoardRole } from "@prisma/client";

export type { BoardRole };

/** DTO board pour le dashboard (liste légère). */
export type BoardSummary = {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  /** ISO côté API ; peut être une Date lors du préchargement serveur. */
  updatedAt: string | Date;
  ownerId: string;
  /** Rôle de l'utilisateur courant sur ce board (null si pas encore chargé). */
  role?: "OWNER" | "MEMBER" | null;
  listCount: number;
};

/** DTO board renvoyé par POST/PATCH /api/boards*. */
export type BoardDto = {
  id: string;
  name: string;
  description: string | null;
  isArchived?: boolean;
  ownerId: string;
  updatedAt: string;
};

/** Réponse GET /api/boards. */
export type BoardsResponse = { boards: BoardSummary[] };

/** Réponse POST /api/boards. */
export type CreateBoardResponse = { board: BoardDto };

/** Réponse PATCH /api/boards/[boardId]. */
export type UpdateBoardResponse = { board: BoardDto };

/** Erreur normalisée des route handlers (cf. lib/api.jsonError). */
export type ApiErrorBody = {
  error: string;
  code:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "INTERNAL_ERROR"
    | string;
  fieldErrors?: Record<string, string[] | undefined>;
};
