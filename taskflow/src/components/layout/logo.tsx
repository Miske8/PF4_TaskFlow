import Link from "next/link";
import { KanbanSquare } from "lucide-react";

/**
 * TaskFlow — logo + lien vers le dashboard (réutilisé dans header et sidebar).
 */
export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <KanbanSquare className="size-4" aria-hidden />
      </span>
      <span>TaskFlow</span>
    </Link>
  );
}
