"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BoardCardGridSkeleton } from "@/components/ui/skeleton";
import { InputField } from "@/components/ui/input";
import { BoardCard } from "@/features/boards/components/board-card";
import { CreateBoardModal } from "@/features/boards/components/create-board-modal";
import { RenameBoardModal } from "@/features/boards/components/rename-board-modal";
import { DeleteBoardDialog } from "@/features/boards/components/delete-board-dialog";
import { boardKeys, useBoards } from "@/features/boards/hooks/use-boards";
import type { BoardSummary } from "@/types";

/** Sérialise les Date du préchargement serveur en ISO (compat. JSON cache). */
function serialize(boards: BoardSummary[]): BoardSummary[] {
  return boards.map((b) => ({
    ...b,
    updatedAt:
      typeof b.updatedAt === "string" ? b.updatedAt : b.updatedAt.toISOString(),
  }));
}

/**
 * TaskFlow — Dashboard des tableaux.
 * - données via TanStack Query (GET /api/boards : owner + member),
 *   avec hydratation du cache depuis le préchargement serveur (SSR instantané),
 * - skeleton pendant le chargement, ErrorState + retry en cas d'échec,
 * - état vide illustré avec CTA de création,
 * - recherche instantanée côté client (filtre par nom/description),
 * - modales : créer / renommer / supprimer (confirmation).
 */
export function BoardsDashboard({ initialBoards }: { initialBoards?: BoardSummary[] }) {
  const queryClient = useQueryClient();
  // Hydratation one-shot du cache (exécute avant le premier fetch du hook).
  useState(() => {
    if (initialBoards?.length) {
      queryClient.setQueryData(boardKeys.lists(), serialize(initialBoards));
    }
    return null;
  });

  const boardsQuery = useBoards();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<BoardSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardSummary | null>(null);
  const [search, setSearch] = useState("");

  const filtered = (boardsQuery.data ?? []).filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      (b.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Mes tableaux
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tableaux dont vous êtes propriétaire ou membre.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden /> Nouveau tableau
        </Button>
      </div>

      {/* Recherche (filtrage local, sans appel réseau) */}
      {!!boardsQuery.data?.length && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <InputField
            label=""
            aria-label="Rechercher un tableau"
            placeholder="Rechercher un tableau…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* États : loading → error → empty → grille */}
      {boardsQuery.isPending ? (
        <BoardCardGridSkeleton count={8} />
      ) : boardsQuery.isError ? (
        <ErrorState
          title="Impossible de charger vos tableaux"
          message={boardsQuery.error.message}
          onRetry={() => void boardsQuery.refetch()}
          retrying={boardsQuery.isRefetching}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="size-5" aria-hidden />}
          title={search ? "Aucun tableau ne correspond à la recherche" : "Aucun tableau pour le moment"}
          description={
            search
              ? `Aucun résultat pour « ${search} ». Essayez un autre terme.`
              : "Créez votre premier tableau pour commencer à organiser vos tâches en colonnes et cartes."
          }
          action={
            !search ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden /> Créer un tableau
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onRename={(b) => setRenameTarget(b)}
              onDelete={(b) => setDeleteTarget(b)}
            />
          ))}
        </div>
      )}

      {/* Overlays */}
      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RenameBoardModal
        board={renameTarget}
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteBoardDialog
        board={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
