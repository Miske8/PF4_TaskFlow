"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardSummary } from "@/types";

/**
 * TaskFlow — carte de tableau sur le dashboard :
 * - clic → ouvre le board,
 * - menu ⋯ (Renommer / Supprimer — Supprimer réservé à l'OWNER, masqué UI
 *   et surtout refusé côté serveur si la règle changeait),
 * - badges rôle + nombre de colonnes, date de dernière activité (relative).
 */

type BoardCardProps = {
  board: BoardSummary;
  onRename: (board: BoardSummary) => void;
  onDelete: (board: BoardSummary) => void;
};

/** Date relative simple sans dépendance lourde (tick horloge via Intl). */
function relativeTime(isoOrDate: string | Date): string {
  try {
    const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    const diffMs = Date.now() - date.getTime();
    const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
    const minutes = Math.round(diffMs / 60_000);
    if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) return rtf.format(-days, "day");
    const months = Math.round(days / 30);
    return rtf.format(-months, "month");
  } catch {
    return "";
  }
}

export function BoardCard({ board, onRename, onDelete }: BoardCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // évite le mismatch SSR/hydratation sur les dates relatives

  const isOwner = board.role === "OWNER" || board.ownerId === undefined;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-zinc-200 bg-white p-4 transition-all",
        "hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700",
      )}
    >
      {/* Lien couvrant toute la carte (accessibilité : titre focusable) */}
      <Link
        href={`/boards/${board.id}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`Ouvrir le tableau ${board.name}`}
      />

      <div className="pointer-events-none relative flex h-full flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {board.name}
          </h3>
          {/* Zone interactive au-dessus du lien couvrant */}
          <div className="pointer-events-auto relative z-10 -mr-1 -mt-1">
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label={`Actions pour ${board.name}`}
                  className="rounded-md p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <MoreVertical className="size-4" />
                </button>
              }
            >
              <DropdownItem onClick={() => onRename(board)}>
                <Pencil className="size-3.5" aria-hidden /> Renommer
              </DropdownItem>
              {isOwner && (
                <>
                  <DropdownSeparator />
                  <DropdownItem destructive onClick={() => onDelete(board)}>
                    <Trash2 className="size-3.5" aria-hidden /> Supprimer
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-zinc-500 dark:text-zinc-400">
          {board.description ?? "Aucune description"}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Badge variant={board.role === "OWNER" ? "default" : "secondary"}>
            {board.role === "OWNER" ? "Propriétaire" : "Membre"}
          </Badge>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {board.listCount} colonne{board.listCount > 1 ? "s" : ""}
            {mounted && board.updatedAt
              ? ` · ${relativeTime(board.updatedAt)}`
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
