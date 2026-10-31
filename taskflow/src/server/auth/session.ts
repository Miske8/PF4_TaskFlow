import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";

/**
 * TaskFlow — helpers de session serveur (React `cache()` = mémoïsés par requête,
 * donc appelables plusieurs fois dans un même rendu sans coût supplémentaire).
 */

/** Session courante ou `null` (pour les composants qui adaptent l'affichage). */
export const getSession = cache(async () => auth());

/** L'utilisateur courant, ou redirige vers /login. À utiliser dans les pages privées. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Id utilisateur courant, ou redirection /login. Pratique pour les services. */
export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}
