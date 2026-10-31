"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { registerUser } from "@/features/auth/actions";
import { registerSchema, zodFieldErrors } from "@/lib/validations/auth.schema";

/**
 * TaskFlow — formulaire d'inscription (email + nom + mot de passe + confirmation).
 * Validation double : Zod côté client, puis à nouveau dans la Server Action.
 */
export function RegisterForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd);

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const result = await registerUser(fd);
    setLoading(false);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      if (result.error) setFormError(result.error);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <KanbanSquare className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte TaskFlow</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gratuit, instantané, sans carte bancaire.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" noValidate>
        <InputField label="Nom complet" name="name" autoComplete="name" placeholder="Ada Lovelace" required error={fieldErrors.name} />
        <InputField label="Email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required error={fieldErrors.email} />
        <InputField label="Mot de passe" name="password" type="password" autoComplete="new-password" placeholder="8 caractères minimum" required error={fieldErrors.password} />
        <InputField label="Confirmer le mot de passe" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Retapez le mot de passe" required error={fieldErrors.confirmPassword} />

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
