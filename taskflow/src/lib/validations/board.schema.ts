import { z } from "zod";

/**
 * TaskFlow — schémas Zod partagés client/serveur pour les boards.
 * Utilisés par : formulaires (client), routes API (serveur), tests unitaires.
 */

export const createBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis")
    .max(100, "100 caractères maximum"),
  description: z
    .string()
    .trim()
    .max(500, "500 caractères maximum")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export const updateBoardSchema = createBoardSchema
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
