"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * TaskFlow — thème : class="dark" sur <html>, préférence système par défaut,
 * storage localStorage → pas de flash entre les pages. `suppressHydrationWarning`
 * est déjà posé sur <html> dans le layout racine.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
