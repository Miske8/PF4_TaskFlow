"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { labelColorClasses, LABEL_COLOR_OPTIONS } from "@/lib/label-colors";
import { createLabelSchema } from "@/lib/validations/label.schema";
import { useCreateLabel } from "../hooks/use-labels";
import type { LabelDto } from "../hooks/use-labels";

/**
 * TaskFlow — formulaire de création de label (nom + pastilles de couleur).
 * Validation Zod locale ; l'unique (board, nom) côté serveur renvoie 422
 * affiché inline. Utilisé dans la palette du board et la modal de carte.
 */
export function CreateLabelForm({
  boardId,
  onCreated,
}: {
  boardId: string;
  onCreated?: (label: LabelDto) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<(typeof LABEL_COLOR_OPTIONS)[number]>("BLUE");
  const [error, setError] = useState<string | null>(null);

  const createLabel = useCreateLabel(boardId);

  const handleSubmit = async () => {
    setError(null);
    const parsed = createLabelSchema.safeParse({ name, color });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Label invalide");
      return;
    }
    try {
      const label = await createLabel.mutateAsync(parsed.data);
      setName("");
      onCreated?.(label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
          placeholder="Nom du label…"
          maxLength={40}
          className="h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={createLabel.isPending || !name.trim()}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Créer
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Couleur du label">
        {LABEL_COLOR_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={color === option}
            aria-label={option.toLowerCase()}
            onClick={() => setColor(option)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition-transform",
              labelColorClasses(option),
              color === option ? "scale-110 ring-2 ring-offset-1 ring-indigo-500" : "hover:scale-105",
            )}
          >
            {color === option && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <X className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
