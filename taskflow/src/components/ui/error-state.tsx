"use client";

import { TriangleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * TaskFlow — ErrorState : bloc d'erreur homogène avec message + retry optionnel.
 * Utilisé par les hooks de données (TanStack Query `isError`) et les pages.
 */
type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function ErrorState({
  title = "Une erreur est survenue",
  message,
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center",
        "dark:border-red-900 dark:bg-red-950/40",
        className,
      )}
    >
      <TriangleAlert className="size-6 text-red-600 dark:text-red-400" />
      <p className="text-sm font-medium text-red-800 dark:text-red-300">{title}</p>
      {message && <p className="max-w-sm text-xs text-red-700/80 dark:text-red-400/80">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} className="mt-1">
          <RotateCcw className="size-3.5" aria-hidden />
          Réessayer
        </Button>
      )}
    </div>
  );
}
