import { cn } from "@/lib/utils";

/**
 * TaskFlow — Badge : petite étiquette (labels de carte, rôles, compteurs).
 * Supporte une couleur Tailwind explicite via `colorClasses` pour les labels Prisma.
 */
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
  /** Surcharge libre (ex. palette des labels : "bg-red-500 text-white"). */
  colorClasses?: string;
};

const variants: Record<string, string> = {
  default: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  outline: "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function Badge({ className, variant = "default", colorClasses, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        colorClasses ?? variants[variant],
        className,
      )}
      {...props}
    />
  );
}
