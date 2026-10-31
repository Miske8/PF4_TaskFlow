import { z } from "zod";

/** TaskFlow — schémas Zod pour la gestion des membres. */

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export const removeMemberSchema = z.object({
  userId: z.string().min(1, "userId requis"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/** PATCH body : changement de rôle (transfert d'ownership — OWNER uniquement). */
export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1, "userId requis"),
  role: z.enum(["OWNER", "MEMBER"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
