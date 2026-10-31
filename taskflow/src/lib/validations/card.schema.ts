import { z } from "zod";

/**
 * TaskFlow — schémas Zod des cartes.
 * Contrat partagé : formulaires client ↔ routes API ↔ services serveur.
 */

export const createCardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(120, "120 caractères maximum"),
});

/**
 * PATCH /api/cards/[cardId] — tous les champs optionnels (édition partielle).
 * - `dueDate` : ISO 8601 ou null (null = retire l'échéance),
 * - `completedAt` : idem (bascule « terminée »).
 */
export const updateCardSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est requis").max(120, "120 caractères maximum").optional(),
    description: z
      .string()
      .max(5000, "5000 caractères maximum")
      .nullable()
      .optional(),
    dueDate: z.string().datetime({ offset: true }).datetime({ message: "Date ISO 8601 invalide" }).nullable().optional(),
    completedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

/** Sérialise une Date (ou null) en ISO pour le corps de requête. */
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
