import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api-client";
import { inviteMemberSchema } from "@/lib/validations/member.schema";
import type {
  InviteMemberResponse,
  MemberDto,
  MembersResponse,
} from "@/features/members/types";
import type { OkResponse } from "@/features/cards/types";

/**
 * TaskFlow — hooks TanStack Query de la collaboration (Étape 15).
 * Les permissions sont TOUJOURS vérifiées côté serveur (requireBoardOwner) ;
 * le client n'utilise `role` que pour masquer les actions interdites (UX).
 */

export const memberKeys = {
  all: ["members"] as const,
  byBoard: (boardId: string) => [...memberKeys.all, boardId] as const,
};

/** GET /api/boards/[boardId]/members — liste des membres (owner ou member). */
export function useMembers(boardId: string) {
  return useQuery({
    queryKey: memberKeys.byBoard(boardId),
    queryFn: async () => {
      const data = await api.get<MembersResponse>(`/api/boards/${boardId}/members`);
      return data.members;
    },
  });
}

/** POST /api/boards/[boardId]/members — inviter un utilisateur existant (OWNER). */
export function useInviteMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation<MemberDto, ApiClientError, { email: string }>({
    mutationFn: async ({ email }) => {
      const input = inviteMemberSchema.parse({ email }); // miroir Zod côté client
      const data = await api.post<InviteMemberResponse>(
        `/api/boards/${boardId}/members`,
        input,
      );
      return data.member;
    },
    onSuccess: (member) => {
      // Patch local immédiat (pas de refetch brutal) puis réconciliation.
      qc.setQueryData<MemberDto[]>(memberKeys.byBoard(boardId), (prev) =>
        prev && !prev.some((m) => m.userId === member.userId)
          ? [...prev, member]
          : prev,
      );
    },
  });
}

/** DELETE /api/boards/[boardId]/members?userId=X — retirer un membre (OWNER). */
export function useRemoveMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation<void, ApiClientError, { userId: string }>({
    mutationFn: async ({ userId }) => {
      await api.delete<OkResponse>(
        `/api/boards/${boardId}/members?userId=${encodeURIComponent(userId)}`,
      );
    },
    onSuccess: (_data, { userId }) => {
      qc.setQueryData<MemberDto[]>(memberKeys.byBoard(boardId), (prev) =>
        prev ? prev.filter((m) => m.userId !== userId) : prev,
      );
    },
  });
}
