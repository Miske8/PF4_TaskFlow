import { cn } from "@/lib/utils";

/**
 * TaskFlow — Skeletons : briques de chargement homogènes (shimmer via animate-pulse).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800", className)}
    />
  );
}

/** Grille de skeletons pour le dashboard des tableaux. */
export function BoardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton d'une carte du dashboard (en-tête + lignes de texte). */
export function BoardCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="size-7 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/** Variante grille avec les skeletons détaillés de cartes board. */
export function BoardCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Colonne kanban en chargement (page board, étapes 8+). */
export function ColumnSkeleton() {
  return (
    <div className="w-72 shrink-0 space-y-2 rounded-xl bg-zinc-200/60 p-3 dark:bg-zinc-800/60">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  );
}
