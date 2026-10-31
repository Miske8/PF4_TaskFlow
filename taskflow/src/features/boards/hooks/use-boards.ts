import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api-client";
import {
  createBoardSchema,
  updateBoardSchema,
  type CreateBoardInput,
  type UpdateBoardInput,
} from "@/lib/validations/board.schema";
import type {
  BoardDto,
  BoardSummary,
  BoardsResponse,
  CreateBoardResponse,
  UpdateBoardResponse,
} from "@/types";

/**
 * TaskFlow — hooks TanStack Query du domaine "boards".
 * Clés centralisées + mutations avec invalidation ciblée ; les erreurs
 * d'API (403/422…) remontent typées pour affichage (toasts / ErrorState).
 */

export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  detail: (boardId: string) => [...boardKeys.all, "detail", boardId] as const,
};

/** GET /api/boards — tableaux dont l'utilisateur est owner ou member. */
export function useBoards() {
  return useQuery({
    queryKey: boardKeys.lists(),
    queryFn: async () => {
      const data = await api.get<BoardsResponse>("/api/boards");
      return data.boards;
    },
  });
}

/** POST /api/boards — création (l'utilisateur devient OWNER). */
export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation<BoardDto, ApiClientError, CreateBoardInput>({
    mutationFn: async (input) => {
      const parsed = createBoardSchema.parse(input); // validation miroir côté client
      const data = await api.post<CreateBoardResponse>("/api/boards", parsed);
      return data.board;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/** PATCH /api/boards/[id] — renommage / description / archivage. */
export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation<
    BoardDto,
    ApiClientError,
    { boardId: string; input: UpdateBoardInput }
  >({
    mutationFn: async ({ boardId, input }) => {
      const parsed = updateBoardSchema.parse(input);
      const data = await api.patch<UpdateBoardResponse>(
        `/api/boards/${boardId}`,
        parsed,
      );
      return data.board;
    },
    onSuccess: (_board, { boardId }) => {
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
      void qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

/** DELETE /api/boards/[id] — OWNER uniquement (403 sinon, géré par le serveur). */
export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiClientError, { boardId: string }>({
    mutationFn: ({ boardId }) => api.delete<{ ok: true }>(`/api/boards/${boardId}`),
    onSuccess: (_data, { boardId }) => {
      void qc.removeQueries({ queryKey: boardKeys.detail(boardId) });
      void qc.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/** Types exportés pour commodité des composants. */
export type { BoardSummary };
