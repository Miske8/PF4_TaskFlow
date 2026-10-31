"use client";

import { useSession } from "next-auth/react";
import { Crown, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { MemberDto } from "@/features/members/types";

/**
 * TaskFlow — Barre d'avatars empilés (header du board).
 * Affiche jusqu'à 5 membres + compteur "+N", tooltip avec les noms.
 */
export function MemberAvatars({
  members,
  max = 5,
}: {
  members: MemberDto[];
  max?: number;
}) {
  const { data: session } = useSession();
  if (members.length === 0) return null;

  const visible = members.slice(0, max);
  const hidden = members.length - visible.length;
  const me = session?.user?.id ? members.find((m) => m.userId === session.user.id) : undefined;

  return (
    <div className="flex items-center gap-2" aria-label={`${members.length} membre(s) sur ce tableau`}>
      <div className="flex -space-x-2">
        {visible.map((m) => (
          <span key={m.userId} title={`${m.name}${m.role === "OWNER" ? " (propriétaire)" : ""}`}>
            <Avatar name={m.name} email={m.email} size="sm" ring />
          </span>
        ))}
        {hidden > 0 && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-950">
            +{hidden}
          </span>
        )}
      </div>
      {me?.role === "OWNER" && (
        <Crown className="size-4 text-amber-500" aria-label="Vous êtes le propriétaire" />
      )}
    </div>
  );
}

/** Chip compact cliquable qui ouvre la modale de gestion des membres. */
export function MembersTrigger({
  members,
  onClick,
}: {
  members: MemberDto[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Users className="size-4" />
      <span className="sr-only sm:not-sr-only">Membres</span>
      <MemberAvatars members={members} max={4} />
    </button>
  );
}
