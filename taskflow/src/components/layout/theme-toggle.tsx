"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * TaskFlow — bascule clair/sombre/ système (next-themes).
 * Icône déterminée après hydratation pour éviter tout mismatch.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Changer de thème"
      // Cycle : system → light → dark → system
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : resolvedTheme === "light" ? "system" : "dark")
      }
      className="w-9 px-0"
    >
      {/* Les deux icônes sont rendues, une seule visible via CSS : zéro flash. */}
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
    </Button>
  );
}
