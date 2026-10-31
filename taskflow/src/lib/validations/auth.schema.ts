import { z } from "zod";

/**
 * TaskFlow — schémas Zod d'authentification, partagés client (formulaires)
 * et serveur (Server Actions). Un seul contrat, deux côtés.
 */

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères (limite bcrypt)")
  .regex(/[a-zA-Z]/, "Doit contenir au moins une lettre")
  .regex(/\d/, "Doit contenir au moins un chiffre");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(60),
  email: z.email("Adresse email invalide").toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.email("Adresse email invalide").toLowerCase(),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/** Type inféré — utilisé par les formulaires ET les Server Actions. */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Résume les erreurs Zod en `{ [champ]: message }` pour affichage sous les inputs. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
