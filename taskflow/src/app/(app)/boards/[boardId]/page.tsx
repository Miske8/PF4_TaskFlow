/**
 * TaskFlow — layout des routes publiques : page "Coming soon" (le vrai board arrive à l'étape 8).
 */
export default function BoardPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-xl font-semibold">Board</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Le kanban avec colonnes, cartes et drag &amp; drop arrive à l&apos;étape 8 🚧
      </p>
    </div>
  );
}
