import { cn } from "@/lib/utils";

/**
 * TaskFlow — EmptyState : affichage soigné quand une liste est vide
 * (dashboard sans board, colonne sans carte, recherche sans résultat…).
 */
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** CTA optionnel (bouton, lien…). */
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-center dark:border-zinc-700",
        compact ? "p-4" : "p-10",
        className,
      )}
    >
      {icon && (
        <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {icon}
        </span>
      )}
      <p className={cn("font-medium text-zinc-900 dark:text-zinc-100", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
