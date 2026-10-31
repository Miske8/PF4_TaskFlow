"use server";

import { AuthError } from "next-auth";
import { db } from "@/server/db/prisma";
import { signIn, signOut } from "@/server/auth/auth";
import { hashPassword } from "@/server/auth/password";
import { registerSchema, type LoginInput } from "@/lib/validations/auth.schema";

/**
 * TaskFlow — Server Actions d'authentification.
 * Contrat unique : `{ ok: true } | { ok: false, error?, fieldErrors? }`
 * pour que les formulaires affichent des messages clairs sans exposer de détails sensibles.
 */
export type AuthActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const GENERIC_LOGIN_ERROR = "Email ou mot de passe incorrect.";

export async function registerUser(formData: FormData): Promise<AuthActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { name, email, password } = parsed.data;

  // Contrainte d'unicité User.email → message explicite côté formulaire.
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, fieldErrors: { email: "Un compte existe déjà avec cet email." } };
  }

  await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  // Connexion automatique après inscription (mêmes règles que le formulaire login).
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: GENERIC_LOGIN_ERROR };
    throw e; // NEXT_REDIRECT (navigation attendue) remonte normalement.
  }
}

export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  try {
    await signIn("credentials", { ...input, redirectTo: "/dashboard" });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: GENERIC_LOGIN_ERROR };
    throw e;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
