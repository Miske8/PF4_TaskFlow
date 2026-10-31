import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUserId } from "@/server/auth/permissions";
import { listAccessibleBoards } from "@/server/services/board.service";
import { BoardsDashboard } from "@/features/boards/components/boards-dashboard";

export const metadata: Metadata = { title: "Tableaux — TaskFlow" };

/**
 * TaskFlow — page Dashboard (Étape 7).
 * Server component dynamique : vérifie la session (`requireUserId` → redirect
 * géré par le proxy) et précharge les boards accessibles (owner + member) pour
 * hydrater le cache TanStack Query côté client (première paint sans spinner).
 */
async function DashboardContent() {
  const userId = await requireUserId();
  const initialBoards = await listAccessibleBoards(userId);
  return <BoardsDashboard initialBoards={initialBoards} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />}>
      <DashboardContent />
    </Suspense>
  );
}
