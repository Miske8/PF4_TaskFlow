"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDeleteBoard } from "@/features/boards/hooks/use-boards";
import { apiErrorMessage } from "@/lib/api-client";
import type { BoardSummary } from "@/types";

/**
 * TaskFlow — confirmation de suppression avant action destructive.
 * Affiche le nom du board et le rappel que les colonnes/cartes partent aussi
 * (cascade Prisma). Le bouton est désactivé tant que la mutation tourne.
 */
export function DeleteBoardDialog({
  board,
  open,
  onClose,
}: {
  board: BoardSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  const deleteBoard = useDeleteBoard();
  const [error, setError] = useState<string | undefined>();

  if (!board) return null;

  const handleConfirm = async () => {
    setError(undefined);
    try {
      await deleteBoard.mutateAsync({ boardId: board.id });
      onClose();
    } catch (err) {
      // 403 possible si l'utilisateur n'est plus owner (ex. autre onglet) : on affiche.
      setError(apiErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Supprimer le tableau" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Voulez-vous vraiment supprimer{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">{board.name}</strong> ?
        </p>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Cette action est définitive. Les {board.listCount} colonne
          {board.listCount > 1 ? "s" : ""}, leurs cartes, labels et commentaires
          seront également supprimés.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={deleteBoard.isPending}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={deleteBoard.isPending}>
            {deleteBoard.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </Modal>
  );
}
