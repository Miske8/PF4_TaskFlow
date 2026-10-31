import { z } from "zod";

/**
 * TaskFlow — schémas Zod des colonnes (List).
 * Contrat partagé : formulaires client ↔ routes API ↔ services serveur.
 */

export const createListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(80, "80 caractères maximum"),
  /** Insertion relative (optionnel) — par défaut : en fin de board. */
  afterListId: z.string().cuid().optional(),
});

export const renameListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(80, "80 caractères maximum"),
});

/**
 * PATCH /api/boards/[boardId]/lists/reorder
 * Séquence EXHAUSTIVE des ids de colonnes dans leur nouvel ordre.
 * Exhaustif ⇒ le serveur peut valider que c'est une permutation exacte
 * (pas de colonne inventée/oubliée) avant de réécrire les positions.
 */
export const reorderListsSchema = z.object({
  listIds: z.array(z.string().cuid()).min(1, "Au moins une colonne requise"),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type RenameListInput = z.infer<typeof renameListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
