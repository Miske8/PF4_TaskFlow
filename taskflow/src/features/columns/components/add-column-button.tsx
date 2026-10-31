"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createListSchema } from "@/lib/validations/list.schema";
import { apiErrorMessage } from "@/lib/api-client";
import { useCreateList } from "../hooks/use-lists";

/**
 * TaskFlow — bouton « Ajouter une colonne » qui se transforme en champ inline.
 * Validation Zod locale ; erreur serveur affichée sous le champ (rollback auto
 * par TanStack Query si nécessaire).
 */
export function AddColumnButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateList(boardId);

  const submit = () => {
    const parsed = createListSchema.safeParse({ title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Titre invalide");
      return;
    }
    setError(null);
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle("");
        setOpen(false);
      },
      onError: (e) => setError(apiErrorMessage(e)),
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-fit w-72 shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-white/50 px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-white hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
      >
        <Plus className="h-4 w-4" /> Ajouter une colonne
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <input
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        autoFocus
        value={title}
        maxLength={80}
        placeholder="Titre de la colonne"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        aria-label="Titre de la nouvelle colonne"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" onClick={submit} loading={create.isPending}>
          Ajouter
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Annuler">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
