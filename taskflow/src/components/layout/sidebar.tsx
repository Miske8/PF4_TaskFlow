"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KanbanSquare, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TaskFlow — navigation principale.
 * Desktop : rail vertical fixe à gauche. Mobile : barre horizontale en bas de l'écran.
 */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableaux", icon: LayoutDashboard },
  { href: "/boards", label: "Mes boards", icon: KanbanSquare },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Rail desktop (≥ lg) */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r border-zinc-200 bg-white px-3 py-4 lg:flex dark:border-zinc-800 dark:bg-zinc-900"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Projet portfolio
          </a>
        </div>
      </nav>

      {/* Barre basse mobile (< lg) */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
      >
        <ul className="mx-auto flex w-full max-w-md items-stretch justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  isActive(href)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
