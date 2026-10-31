"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useUpdateBoard } from "@/features/boards/hooks/use-boards";
import { updateBoardSchema } from "@/lib/validations/board.schema";
import { apiErrorMessage, ApiClientError } from "@/lib/api-client";
import type { BoardSummary } from "@/types";

/**
 * TaskFlow — renommage d'un tableau depuis le dashboard (owner ou member).
 * Le champ est pré-rempli ; validation Zod miroir ; erreurs serveur affichées.
 */
export function RenameBoardModal({
  board,
  open,
  onClose,
}: {
  board: BoardSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateBoard = useUpdateBoard();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  // Pré-remplit à chaque ouverture sur un nouveau board
  useEffect(() => {
    if (open && board) {
      setName(board.name);
      setError(undefined);
    }
  }, [open, board]);

  if (!board) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = updateBoardSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.name?.[0] ?? "Nom invalide");
      return;
    }
    if (parsed.data.name === board.name) {
      onClose(); // rien à faire
      return;
    }
    setError(undefined);
    try {
      await updateBoard.mutateAsync({ boardId: board.id, input: parsed.data });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError && err.fieldErrors?.name
          ? err.fieldErrors.name[0]
          : apiErrorMessage(err),
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Renommer le tableau" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <InputField
          label="Nom du tableau"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          maxLength={100}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={updateBoard.isPending || !name.trim()}>
            {updateBoard.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
