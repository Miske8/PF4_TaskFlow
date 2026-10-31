import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des class names conditionnels et résout les conflits Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a fractional position key between two keys (lexo-rank simplifié). */
export const POSITION_GAP = 1000;
