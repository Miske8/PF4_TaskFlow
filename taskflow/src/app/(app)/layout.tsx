/**
 * TaskFlow — layout des routes privées : sidebar (rail desktop / barre mobile) + header.
 * Le header lit la session (requireUser = 2e ligne de défense après le proxy Auth.js).
 */
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { logoutUser } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/layout/logo";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Zone droite du header : session utilisateur, rendue en streaming via <Suspense>. */
async function HeaderUserActions() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">
        {user.name ?? user.email}
      </span>
      <Avatar name={user.name} email={user.email} image={user.image} size="sm" />
      <form action={logoutUser}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Se déconnecter">
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </form>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar utilise usePathname() : on la stream pour permettre le prerendering (cacheComponents Next 16). */}
      <Suspense fallback={<div className="hidden w-56 lg:block" aria-hidden />}>
        <Sidebar />
      </Suspense>

      {/* Décalage latéral : rail fixe uniquement ≥ lg */}
      <div className="lg:pl-56">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Suspense
                fallback={<div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />}
              >
                <HeaderUserActions />
              </Suspense>
            </div>
          </div>
        </header>

        {/* pb-24 : espace pour la barre de navigation basse sur mobile */}
        <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
