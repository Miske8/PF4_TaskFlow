import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { createLabelSchema, type CreateLabelInput } from "@/lib/validations/label.schema";
import type { CardDto, CardResponse, OkResponse } from "@/features/cards/types";

/**
 * TaskFlow — hooks TanStack Query des labels (Étape 14).
 * La palette est scopée au board ; l'attach/detach patche le cache détail carte.
 */

export type LabelDto = { id: string; name: string; color: string; boardId: string };

export const labelKeys = {
  all: ["labels"] as const,
  byBoard: (boardId: string) => [...labelKeys.all, boardId] as const,
};

const cardDetailKey = (cardId: string) => ["cards", "detail", cardId] as const;

type LabelsResponse = { labels: LabelDto[] };

/** GET /api/boards/[boardId]/labels — palette du board. */
export function useLabels(boardId: string) {
  return useQuery({
    queryKey: labelKeys.byBoard(boardId),
    queryFn: async () => {
      const data = await api.get<LabelsResponse>(`/api/boards/${boardId}/labels`);
      return data.labels;
    },
  });
}

/** POST /api/boards/[boardId]/labels — créer un label. */
export function useCreateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw: unknown): Promise<LabelDto> => {
      const input: CreateLabelInput = createLabelSchema.parse(raw);
      const data = await api.post<{ label: LabelDto }>(`/api/boards/${boardId}/labels`, input);
      return data.label;
    },
    onSuccess: (label) => {
      qc.setQueryData<LabelDto[]>(labelKeys.byBoard(boardId), (prev) =>
        prev ? [...prev, label].sort((a, b) => a.name.localeCompare(b.name)) : [label],
      );
    },
  });
}

/** Revalidation douce du détail carte après settle (source de vérité serveur). */
async function refetchCardDetail(qc: ReturnType<typeof useQueryClient>, cardId: string) {
  try {
    const data = await api.get<CardResponse>(`/api/cards/${cardId}`);
    qc.setQueryData(cardDetailKey(cardId), data.card);
  } catch {
    /* silencieux : le prochain focus/stale refetch rattrapera */
  }
}

/** POST /api/cards/[cardId]/labels — attacher (optimistic sur le cache détail). */
export function useAttachLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, labelId }: { cardId: string; labelId: string }) => {
      return api.post<OkResponse>(`/api/cards/${cardId}/labels`, { labelId });
    },
    onMutate: async ({ cardId, labelId }) => {
      await qc.cancelQueries({ queryKey: cardDetailKey(cardId) });
      const previous = qc.getQueryData<CardDto>(cardDetailKey(cardId));
      const palette = qc.getQueryData<LabelDto[]>(labelKeys.byBoard(boardId));
      const label = palette?.find((l) => l.id === labelId);
      if (previous && label && !previous.labels.some((l) => l.id === labelId)) {
        qc.setQueryData<CardDto>(cardDetailKey(cardId), {
          ...previous,
          labels: [...previous.labels, { id: label.id, name: label.name, color: label.color }],
        });
      }
      return { previous };
    },
    onError: (_err, { cardId }, ctx) => {
      if (ctx?.previous) qc.setQueryData(cardDetailKey(cardId), ctx.previous);
    },
    onSettled: (_data, _err, { cardId }) => {
      void refetchCardDetail(qc, cardId);
    },
  });
}

/** DELETE /api/cards/[cardId]/labels/[labelId] — détacher (idempotent). */
export function useDetachLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, labelId }: { cardId: string; labelId: string }) => {
      return api.delete<OkResponse>(`/api/cards/${cardId}/labels/${labelId}`);
    },
    onSuccess: (_data, { cardId, labelId }) => {
      const current = qc.getQueryData<CardDto>(cardDetailKey(cardId));
      if (current) {
        qc.setQueryData<CardDto>(cardDetailKey(cardId), {
          ...current,
          labels: current.labels.filter((l) => l.id !== labelId),
        });
      }
    },
  });
}
