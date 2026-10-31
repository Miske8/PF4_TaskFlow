import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Tableaux" };

async function DashboardContent() {
  const user = await requireUser();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Mes tableaux</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Bienvenue {user.name ?? user.email} — authentification OK ✔ (le CRUD des tableaux arrive à l’étape 7).
      </p>
    </section>
  );
}

/** Placeholder temporaire — le vrai dashboard arrive à l'Étape 7. */
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />}>
      <DashboardContent />
    </Suspense>
  );
}
