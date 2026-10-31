"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Crown, UserPlus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { apiErrorMessage } from "@/lib/api-client";
import { inviteMemberSchema } from "@/lib/validations/member.schema";
import {
  useInviteMember,
  useMembers,
  useRemoveMember,
} from "@/features/members/hooks/use-members";
import type { MemberDto } from "@/features/members/types";

/**
 * TaskFlow — Modale de gestion des membres (Étape 15).
 * - Lecture : owner ET member voient la liste.
 * - Écriture (inviter / retirer) : réservée à l'OWNER (masquée côté UI,
 *   et surtout refusée 403 côté serveur via requireBoardOwner).
 */
export function MembersModal({
  boardId,
  open,
  onClose,
}: {
  boardId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const membersQuery = useMembers(boardId);
  const invite = useInviteMember(boardId);
  const remove = useRemoveMember(boardId);

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<MemberDto | null>(null);

  const isOwner =
    membersQuery.data?.some(
      (m) => m.userId === session?.user?.id && m.role === "OWNER",
    ) ?? false;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setFeedback(null);

    // Validation Zod miroir avant appel réseau → message inline immédiat.
    const parsed = inviteMemberSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Email invalide");
      return;
    }

    try {
      const member = await invite.mutateAsync({ email: parsed.data.email });
      setFeedback({ kind: "ok", text: `${member.name} a rejoint le tableau.` });
      setEmail("");
    } catch (error) {
      // 404 → « Aucun compte TaskFlow avec cet email » (message clair demandé)
      // 422 → déjà membre · 403 → pas owner (impossible ici, garde-fou).
      setFeedback({ kind: "error", text: apiErrorMessage(error) });
    }
  }

  async function confirmRemoval() {
    if (!pendingRemoval) return;
    try {
      await remove.mutateAsync({ userId: pendingRemoval.userId });
      setFeedback({ kind: "ok", text: `${pendingRemoval.name} a été retiré du tableau.` });
      setPendingRemoval(null);
    } catch (error) {
      setFeedback({ kind: "error", text: apiErrorMessage(error) });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Membres du tableau" size="sm">
      {/* Invitation — OWNER uniquement */}
      {isOwner && (
        <form onSubmit={handleInvite} className="mb-4 space-y-2">
          <div className="flex items-end gap-2">
            <InputField
              label="Inviter par email"
              type="email"
              placeholder="camille@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldError ?? undefined}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" loading={invite.isPending} className="mb-0 shrink-0">
              <UserPlus className="mr-1.5 size-4" /> Inviter
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            L&apos;utilisateur doit avoir un compte TaskFlow. Il apparaîtra
            dans son dashboard dès l&apos;invitation acceptée.
          </p>
        </form>
      )}

      {/* Feedback global (succès / erreur d'invitation ou de retrait) */}
      {feedback && (
        <div
          role="status"
          className={
            feedback.kind === "ok"
              ? "mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          }
        >
          {feedback.text}
        </div>
      )}

      {/* Liste des membres */}
      {membersQuery.isLoading ? (
        <ul className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-44" />
              </div>
            </li>
          ))}
        </ul>
      ) : membersQuery.isError ? (
        <ErrorState
          message="Impossible de charger les membres."
          onRetry={() => void membersQuery.refetch()}
          retrying={membersQuery.isFetching}
        />
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {membersQuery.data?.map((m) => {
            const isSelf = m.userId === session?.user?.id;
            return (
              <li key={m.userId} className="flex items-center gap-3 py-2.5">
                <Avatar name={m.name} email={m.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name}
                    {isSelf && <span className="ml-1 text-xs text-zinc-400">(vous)</span>}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{m.email}</p>
                </div>

                {m.role === "OWNER" ? (
                  <Badge variant="warning" className="shrink-0 gap-1">
                    <Crown className="size-3" /> Owner
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    Member
                  </Badge>
                )}

                {/* Retirer — OWNER uniquement, jamais l'owner ni soi-même en tant qu'owner */}
                {isOwner && m.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => setPendingRemoval(m)}
                    aria-label={`Retirer ${m.name} du tableau`}
                    className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Confirmation avant retrait (demandée au cahier des charges) */}
      {pendingRemoval && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Retirer <strong>{pendingRemoval.name}</strong> de ce tableau ?
            Il perdra immédiatement l&apos;accès aux colonnes et cartes.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingRemoval(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={remove.isPending}
              onClick={() => void confirmRemoval()}
            >
              Confirmer le retrait
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
