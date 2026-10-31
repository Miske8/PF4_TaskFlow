"use client";

import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { labelColorClasses } from "@/lib/label-colors";
import { useLabels, useAttachLabel, useDetachLabel } from "../hooks/use-labels";
import { CreateLabelForm } from "./create-label-form";

/**
 * TaskFlow — sélecteur de labels d'une carte (modal étape 13).
 * - palette du board (GET /api/boards/[id]/labels),
 * - clic = attach/detach avec optimistic update sur le cache détail,
 * - création inline via CreateLabelForm.
 */
export function LabelPicker({
  boardId,
  cardId,
  selectedIds,
}: {
  boardId: string;
  cardId: string;
  selectedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const { data: labels, isLoading } = useLabels(boardId);
  const attach = useAttachLabel(boardId);
  const detach = useDetachLabel();

  const selected = new Set(selectedIds);

  const toggle = (labelId: string) => {
    if (selected.has(labelId)) {
      detach.mutate({ cardId, labelId });
    } else {
      attach.mutate({ cardId, labelId });
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        aria-expanded={open}
      >
        <Tag className="h-4 w-4" /> Labels
        {selectedIds.length > 0 && (
          <span className="rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {selectedIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-md" />
              ))}
            </div>
          ) : labels && labels.length > 0 ? (
            <ul className="mb-3 space-y-1">
              {labels.map((label) => {
                const isSelected = selected.has(label.id);
                return (
                  <li key={label.id}>
                    <button
                      type="button"
                      onClick={() => toggle(label.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        isSelected && "bg-zinc-50 dark:bg-zinc-800",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 shrink-0 rounded-full",
                          labelColorClasses(label.color),
                        )}
                      />
                      <span className="flex-1 truncate">{label.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-zinc-500">Aucun label dans ce tableau.</p>
          )}

          <CreateLabelForm boardId={boardId} />
        </div>
      )}
      {(attach.isError || detach.isError) && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <X className="h-3.5 w-3.5" /> Échec de la mise à jour des labels.
        </p>
      )}
    </div>
  );
}
