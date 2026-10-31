import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "@/lib/api-client";
import {
  createCardSchema,
  updateCardSchema,
  type CreateCardInput,
  type UpdateCardInput,
} from "@/lib/validations/card.schema";
import type { CardDto, CardResponse, OkResponse } from "../types";

/**
 * TaskFlow — hooks TanStack Query du domaine "cartes" (Étapes 10 → 14).
 * - mutations typées avec validation Zod AVANT envoi (erreurs champ à champ),
 * - cache patché localement au succès (pas de refetch brutal),
 * - erreurs normalisées via `apiErrorMessage` pour toasts/ErrorState.
 */

export const cardKeys = {
  all: ["cards"] as const,
  detail: (cardId: string) => [...cardKeys.all, "detail", cardId] as const,
};

/** Clé des colonnes d'un board (les cartes y sont stockées par colonne). */
const cardsOfListKey = (boardId: string, listId: string) =>
  ["cards", boardId, listId] as const;

/** PATCH local dans toutes les requêtes « liste de cartes » connues. */
function patchCardInCaches(qc: ReturnType<typeof useQueryClient>, card: CardDto) {
  qc.setQueriesData<CardDto[]>({ queryKey: ["cards"] }, (prev) =>
    prev ? prev.map((c) => (c.id === card.id ? card : c)) : prev,
  );
}

function removeCardFromCaches(qc: ReturnType<typeof useQueryClient>, cardId: string) {
  qc.setQueriesData<CardDto[]>({ queryKey: ["cards"] }, (prev) =>
    prev ? prev.filter((c) => c.id !== cardId) : prev,
  );
}

/* ------------------------------------------------------------------ */
/* Lecture détail (modal étape 13)                                     */
/* ------------------------------------------------------------------ */

export function useCard(cardId: string | null) {
  return useQuery({
    queryKey: cardKeys.detail(cardId ?? ""),
    queryFn: async () => {
      const data = await api.get<CardResponse>(`/api/cards/${cardId}`);
      return data.card;
    },
    enabled: Boolean(cardId),
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                            */
/* ------------------------------------------------------------------ */

/** POST /api/lists/[listId]/cards — créer une carte en fin de colonne. */
export function useCreateCard(boardId: string, listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw: unknown): Promise<CardDto> => {
      const input: CreateCardInput = createCardSchema.parse(raw);
      const data = await api.post<CardResponse>(`/api/lists/${listId}/cards`, input);
      return data.card;
    },
    onSuccess: (card) => {
      qc.setQueryData<CardDto[]>(cardsOfListKey(boardId, listId), (prev) =>
        prev ? [...prev, card] : [card],
      );
    },
  });
}

/** PATCH /api/cards/[cardId] — titre / description / échéance / terminé. */
export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, raw }: { cardId: string; raw: unknown }): Promise<CardDto> => {
      const input: UpdateCardInput = updateCardSchema.parse(raw);
      const data = await api.patch<CardResponse>(`/api/cards/${cardId}`, input);
      return data.card;
    },
    onSuccess: (card) => {
      patchCardInCaches(qc, card);
      qc.setQueryData(cardKeys.detail(card.id), card);
    },
  });
}

/** DELETE /api/cards/[cardId]. */
export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string): Promise<OkResponse> => {
      return api.delete<OkResponse>(`/api/cards/${cardId}`);
    },
    onSuccess: (_data, cardId) => {
      removeCardFromCaches(qc, cardId);
      qc.removeQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
}

/** PATCH /api/cards/[cardId]/move — déplacement persistant (DnD). */
export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      toListId,
      prevOrder,
      nextOrder,
    }: {
      cardId: string;
      toListId: string;
      prevOrder: number | null;
      nextOrder: number | null;
    }): Promise<CardDto> => {
      const data = await api.patch<CardResponse>(`/api/cards/${cardId}/move`, {
        toListId,
        prevOrder,
        nextOrder,
      });
      return data.card;
    },
    onSuccess: (card) => patchCardInCaches(qc, card),
  });
}

export { apiErrorMessage };
