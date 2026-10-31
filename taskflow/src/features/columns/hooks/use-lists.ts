import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "@/lib/api-client";
import {
  createListSchema,
  renameListSchema,
  reorderListsSchema,
  type CreateListInput,
  type RenameListInput,
} from "@/lib/validations/list.schema";
import type { ListDto, ListsResponse, ListResponse, OkResponse } from "../types";

/**
 * TaskFlow — hooks TanStack Query du domaine "colonnes" (Étape 9).
 *
 * ⚠️ Étape 12 : les mutations de réordonnancement sont déjà écrites pour
 * l'optimistic update (snapshot + rollback via onMutate/onError) ; elles
 * seront branchées sur le cache complet du board à l'étape 11/12 (dnd-kit).
 */

export const listKeys = {
  all: ["lists"] as const,
  byBoard: (boardId: string) => [...listKeys.all, boardId] as const,
};

/** GET /api/boards/[boardId]/lists — colonnes triées par order asc. */
export function useLists(boardId: string, initialData?: ListDto[]) {
  return useQuery({
    queryKey: listKeys.byBoard(boardId),
    queryFn: async () => {
      const data = await api.get<ListsResponse>(`/api/boards/${boardId}/lists`);
      return data.lists;
    },
    initialData,
  });
}

/** POST /api/boards/[boardId]/lists — créer une colonne. */
export function useCreateList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw: unknown) => {
      const input: CreateListInput = createListSchema.parse(raw);
      const data = await api.post<ListResponse>(`/api/boards/${boardId}/lists`, input);
      return data.list;
    },
    onSuccess: (list) => {
      qc.setQueryData<ListDto[]>(listKeys.byBoard(boardId), (prev) =>
        prev ? [...prev, list] : [list],
      );
    },
  });
}

/** PATCH /api/lists/[listId] — renommer (cache local mis à jour sans refetch). */
export function useRenameList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, raw }: { listId: string; raw: unknown }) => {
      const input: RenameListInput = renameListSchema.parse(raw);
      const data = await api.patch<ListResponse>(`/api/lists/${listId}`, input);
      return data.list;
    },
    onSuccess: (list) => {
      qc.setQueryData<ListDto[]>(listKeys.byBoard(boardId), (prev) =>
        prev?.map((l) => (l.id === list.id ? list : l)),
      );
    },
  });
}

/** DELETE /api/lists/[listId] — supprimer la colonne et ses cartes. */
export function useDeleteList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete<OkResponse>(`/api/lists/${listId}`);
      return listId;
    },
    onSuccess: (listId) => {
      qc.setQueryData<ListDto[]>(listKeys.byBoard(boardId), (prev) =>
        prev?.filter((l) => l.id !== listId),
      );
    },
  });
}

/**
 * PATCH /api/boards/[boardId]/lists/reorder — persistance du drag & drop.
 * Optimistic-first : on applique immédiatement la nouvelle séquence au cache,
 * puis on synchronise avec la réponse serveur ; rollback au moindre échec.
 */
export function useReorderLists(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw: unknown) => {
      const { listIds } = reorderListsSchema.parse(raw);
      const data = await api.patch<ListsResponse>(
        `/api/boards/${boardId}/lists/reorder`,
        { listIds },
      );
      return data.lists;
    },
    onMutate: async (raw: unknown) => {
      const { listIds } = reorderListsSchema.parse(raw);
      await qc.cancelQueries({ queryKey: listKeys.byBoard(boardId) });
      const previous = qc.getQueryData<ListDto[]>(listKeys.byBoard(boardId));

      // Tri optimiste : on repositionne selon la séquence demandée en
      // conservant les orders existants comme référence d'index.
      if (previous) {
        const byId = new Map(previous.map((l) => [l.id, l]));
        const next = listIds
          .map((id, i) => {
            const l = byId.get(id);
            return l ? { ...l, order: i + 1 } : null;
          })
          .filter((l): l is ListDto => l !== null);
        qc.setQueryData(listKeys.byBoard(boardId), next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(listKeys.byBoard(boardId), context.previous);
      }
    },
    onSuccess: (lists) => {
      qc.setQueryData(listKeys.byBoard(boardId), lists);
    },
  });
}

/** Message d'erreur prêt à afficher (toasts / ErrorState inline). */
export { apiErrorMessage };
