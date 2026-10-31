"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { renameListSchema } from "@/lib/validations/list.schema";
import { apiErrorMessage } from "@/lib/api-client";
import { useDeleteList, useRenameList } from "../hooks/use-lists";
import type { ListDto } from "../types";

/**
 * TaskFlow — en-tête d'une colonne (Étape 9).
 * Inline edition du titre (validation Zod locale avant mutation) + menu
 * actions avec confirmation de suppression. Le drag handle sera branché à
 * l'Étape 11 via un prop `handle` (dnd-kit).
 */
export function ColumnHeader({
  list,
  boardId,
  canEdit = true,
}: {
  list: ListDto;
  boardId: string;
  canEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rename = useRenameList(boardId);
  const remove = useDeleteList(boardId);

  const commitRename = () => {
    const parsed = renameListSchema.safeParse({ title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Titre invalide");
      return;
    }
    setError(null);
    rename.mutate(
      { listId: list.id, raw: parsed.data },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      {editing ? (
        <div className="flex flex-1 items-center gap-1">
          <input
            className="h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            autoFocus
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setTitle(list.title);
                setEditing(false);
                setError(null);
              }
            }}
            aria-label="Nouveau titre de la colonne"
          />
          <Button size="sm" onClick={commitRename} loading={rename.isPending}>
            OK
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onDoubleClick={() => canEdit && setEditing(true)}
          className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100"
          title={canEdit ? "Double-clic pour renommer" : list.title}
        >
          {list.title}
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {canEdit && !editing && (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" aria-label={`Actions sur ${list.title}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        >
          <DropdownItem
            onClick={() => {
              setTitle(list.title);
              setEditing(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Renommer
          </DropdownItem>
          <DropdownItem destructive onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer la colonne
          </DropdownItem>
        </Dropdown>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Supprimer la colonne"
        size="sm"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Supprimer <strong>{list.title}</strong> et ses{" "}
          <strong>{list.cardCount} carte(s)</strong> ? Cette action est irréversible.
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{apiErrorMessage(error)}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(list.id, {
                onSuccess: () => setConfirmOpen(false),
                onError: (e) => setError(apiErrorMessage(e)),
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
