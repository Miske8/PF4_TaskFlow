"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { toDateInputValue, dateInputToIso } from "@/lib/dates";
import { useUpdateCard } from "../hooks/use-cards";

/**
 * TaskFlow — éditeur de date d'échéance (modal étape 13).
 * <input type="date"> local → ISO midi (anti drift UTC) via PATCH /api/cards.
 */
export function DueDatePicker({
  cardId,
  dueDate,
}: {
  cardId: string;
  dueDate: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const updateCard = useUpdateCard();

  const setValue = (value: string) => {
    setError(null);
    updateCard.mutate(
      { cardId, raw: { dueDate: value ? dateInputToIso(value) : null } },
      { onError: (err) => setError(err.message) },
    );
  };

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4" aria-hidden /> Échéance
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={toDateInputValue(dueDate)}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" /> Retirer
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {updateCard.isPending && <p className="text-xs text-zinc-400">Enregistrement…</p>}
    </div>
  );
}
