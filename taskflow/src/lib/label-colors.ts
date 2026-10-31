import type { LabelColorValue } from "@/lib/validations/label.schema";

/**
 * TaskFlow — palette des labels : mapping enum Prisma → classes Tailwind.
 * ⚠️ Classes complètes et littérales (extraction JIT de Tailwind).
 */

export const LABEL_COLOR_CLASSES: Record<LabelColorValue, string> = {
  GREY: "bg-zinc-400 text-white dark:bg-zinc-500",
  RED: "bg-red-500 text-white",
  ORANGE: "bg-orange-500 text-white",
  YELLOW: "bg-yellow-400 text-yellow-950",
  GREEN: "bg-emerald-500 text-white",
  BLUE: "bg-blue-500 text-white",
  PURPLE: "bg-purple-500 text-white",
  PINK: "bg-pink-500 text-white",
};

export const LABEL_COLOR_OPTIONS = Object.keys(LABEL_COLOR_CLASSES) as LabelColorValue[];

export function labelColorClasses(color: string): string {
  return LABEL_COLOR_CLASSES[color as LabelColorValue] ?? LABEL_COLOR_CLASSES.GREY;
}
