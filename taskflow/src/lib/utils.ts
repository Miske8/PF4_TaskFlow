import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des class names conditionnels et résout les conflits Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a fractional position key between two keys (lexo-rank simplifié). */
export const POSITION_GAP = 1000;

/** Initiales affichées dans un Avatar ("Ada Lovelace" → "AL", "ada@x.com" → "A"). */
export function initials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "?";
  // Email : première lettre de la partie locale, en majuscule.
  if (cleaned.includes("@") && !cleaned.includes(" ")) {
    return cleaned[0].toUpperCase();
  }
  const parts = cleaned.split(/\s+/);
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
