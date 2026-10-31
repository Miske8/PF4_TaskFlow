import { differenceInCalendarDays, format, isToday } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * TaskFlow — helpers d'échéance (date-fns, locale FR).
 * Unicité de la logique d'affichage « due date » côté client.
 */

export type DueStatus = "none" | "overdue" | "today" | "soon" | "later";

/** Statut visuel d'une échéance par rapport à aujourd'hui. */
export function getDueStatus(dueDate: Date | string | null | undefined): DueStatus {
  if (!dueDate) return "none";
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const days = differenceInCalendarDays(date, new Date());
  if (days < 0) return "overdue";
  if (isToday(date)) return "today";
  if (days <= 3) return "soon";
  return "later";
}

/** Libellé court : « Hier », « Aujourd'hui », « 12 mars », « dans 5 j ». */
export function formatDueLabel(dueDate: Date | string): string {
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const days = differenceInCalendarDays(date, new Date());
  if (days === 0) return "Aujourd'hui";
  if (days === -1) return "Hier";
  if (days === 1) return "Demain";
  if (days < 0) return `Retard ${Math.abs(days)} j`;
  if (days <= 7) return `Dans ${days} j`;
  return format(date, "d MMM yyyy", { locale: fr });
}

/** Valeur pour un <input type="date"> (yyyy-MM-dd, en heures locales). */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd");
}

/** Convertit une valeur yyyy-MM-dd en ISO local midi (évite le drift UTC). */
export function dateInputToIso(value: string): string {
  const [y, m, day] = value.split("-").map(Number);
  return new Date(y, m - 1, day, 12, 0, 0).toISOString();
}
