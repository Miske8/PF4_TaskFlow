import type { BoardRole } from "@/types";

/**
 * TaskFlow — DTO membres exposés par l'API (Étape 15).
 * ⚠️ Champs volontairement minimaux : id / name / email / role uniquement.
 * (cf. GET /api/boards/[boardId]/members → select Prisma côté serveur)
 */
export type MemberDto = {
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
  joinedAt: string; // ISO
};

export type MembersResponse = { members: MemberDto[] };
export type InviteMemberResponse = { member: MemberDto };
