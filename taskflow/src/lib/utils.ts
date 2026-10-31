/** Combine conditional class names (helper Tailwind). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Generate a fractional position key between two keys (lexo-rank simplifié). */
export const POSITION_GAP = 1000;
