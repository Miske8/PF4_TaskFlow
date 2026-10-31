import { z } from "zod";

/**
 * TaskFlow — schémas Zod des labels (étiquettes de board, N:N avec les cartes).
 * La liste des couleurs est alignée sur l'enum Prisma `LabelColor`.
 */

export const LABEL_COLORS = [
  "GREY",
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "PURPLE",
  "PINK",
] as const;

export const labelColorSchema = z.enum(LABEL_COLORS);

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom du label est requis")
    .max(40, "40 caractères maximum"),
  color: labelColorSchema,
});

/** Associer un label existant du board à une carte. */
export const attachLabelSchema = z.object({
  labelId: z.string().cuid("Identifiant de label invalide"),
});

export type LabelColorValue = (typeof LABEL_COLORS)[number];
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type AttachLabelInput = z.infer<typeof attachLabelSchema>;
