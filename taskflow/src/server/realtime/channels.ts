/**
 * TaskFlow — convention unique des noms de canaux Pusher.
 * Partagée serveur + client : un seul endroit à changer si la stratégie évolue.
 *
 * Canaux PRIVÉS (`private-` = préfixe obligatoire Pusher pour qu'un canal
 * soit sécurisé) : un abonné ne peut jamais s'abonner sans passer par
 * `/api/pusher/auth`, qui vérifie l'accès au board côté serveur.
 */

/** Canal privé d'un board : `private-board-{boardId}`. */
export function boardChannelName(boardId: string): string {
  return `private-board-${boardId}`;
}

/** Un utilisateur est-il membre du board ? (seule règle d'abonnement). */
export async function canAccessBoardChannel(
  userId: string,
  channelName: string,
  isMember: (userId: string, boardId: string) => Promise<boolean>,
): Promise<boolean> {
  const match = /^private-board-(.+)$/.exec(channelName);
  if (!match) return false; // canal inconnu → refus systématique (default deny)
  return isMember(userId, match[1]!);
}
