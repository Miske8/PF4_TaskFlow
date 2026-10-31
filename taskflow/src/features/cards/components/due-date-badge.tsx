"use client";

import { CalendarClock, CalendarDays, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDueLabel, getDueStatus } from "@/lib/dates";

/**
 * TaskFlow — badge d'échéance avec indicateur visuel :
 *  - dépassée  → rouge + icône alerte,
 *  - aujourd'hui → ambre,
 *  - ≤ 3 jours  → ambre doux,
 *  - plus tard  → neutre.
 * Une carte terminée n'affiche plus d'alerte retard.
 */
export function DueDateBadge({
  dueDate,
  completed = false,
  className,
}: {
  dueDate: string | Date | null | undefined;
  completed?: boolean;
  className?: string;
}) {
  const status = getDueStatus(dueDate);
  if (status === "none") return null;

  const isOverdue = status === "overdue" && !completed;
  const Icon = isOverdue ? AlertTriangle : status === "today" ? CalendarClock : CalendarDays;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        isOverdue
          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          : status === "today" || status === "soon"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        completed && "line-through opacity-60",
        className,
      )}
      title={
        dueDate
          ? `Échéance : ${new Date(dueDate).toLocaleDateString("fr-FR")}`
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {formatDueLabel(dueDate as string | Date)}
    </span>
  );
}
