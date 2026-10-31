/**
 * TaskFlow — types du domaine "listes" (colonnes), alignés sur les DTOs
 * renvoyés par /api/boards/[boardId]/lists* (cf. server/services/list.service).
 */

export type ListDto = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: string; // ISO en provenance de l'API
  updatedAt: string;
  cardCount: number;
};

export type ListsResponse = { lists: ListDto[] };
export type ListResponse = { list: ListDto };
export type OkResponse = { ok: true };
