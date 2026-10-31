"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { loginUser } from "@/features/auth/actions";
import { loginSchema, zodFieldErrors } from "@/lib/validations/auth.schema";

/**
 * TaskFlow — formulaire de connexion (validation Zod côté client avant la Server Action).
 */
export function LoginForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const raw = { email: fd.get("email"), password: fd.get("password") };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const result = await loginUser(parsed.data);
    setLoading(false);
    if (!result.ok) setFormError(result.error ?? "Une erreur est survenue.");
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <KanbanSquare className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Connexion à TaskFlow</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gérez vos tableaux en équipe, en temps réel.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" noValidate>
        <InputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
          error={fieldErrors.email}
        />
        <InputField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          error={fieldErrors.password}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Se connecter
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
