"use client";

import { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * TaskFlow — Dropdown accessible "popover natif" : pas de dépendance externe,
 * fermeture au clic extérieur / Escape, alignement configurable.
 * Usage : <Dropdown trigger={<Button…/>}><DropdownItem…/></Dropdown>
 */
type DropdownProps = {
  /** Contenu déclencheur (bouton, icône…). */
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

export function Dropdown({ trigger, children, align = "end", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <div
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </div>
      {open && (
        <div
          id={menuId}
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute z-40 mt-1 min-w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg",
            "dark:border-zinc-800 dark:bg-zinc-900",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type DropdownItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  destructive?: boolean;
};

export function DropdownItem({ className, destructive, onClick, ...props }: DropdownItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-700 transition-colors",
        "hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        destructive && "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />;
}
