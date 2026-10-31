/**
 * TaskFlow — layout des routes privées : header avec session utilisateur + déconnexion.
 * (Le middleware protège déjà ces routes ; `requireUser()` est la 2e ligne de défense.)
 */
import { Suspense } from "react";
import Link from "next/link";
import { KanbanSquare, LogOut } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { logoutUser } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

/** En-tête privé : lit la session (différée via <Suspense> — cacheComponents Next 16). */
async function HeaderUserActions() {
  const user = await requireUser();
  return (
    <>
      <span className="hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">
        {user.name ?? user.email}
      </span>
      <form action={logoutUser}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Se déconnecter">
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </form>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <KanbanSquare className="size-4" />
            </span>
            TaskFlow
          </Link>
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />}>
              <HeaderUserActions />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
