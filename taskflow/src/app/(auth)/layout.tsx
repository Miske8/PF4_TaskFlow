/**
 * TaskFlow — layout du groupe de routes publiques (login / register) : centrage plein écran.
 * NB : si un utilisateur connecté atteint /login ou /register, le proxy Auth.js
 * (callback `authorized`) le redirige automatiquement vers /dashboard.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-12 dark:from-zinc-950 dark:to-zinc-900">
      {children}
    </div>
  );
}
