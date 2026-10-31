import { Pusher } from "pusher";
import type { RealtimeEvent, PayloadFor } from "./events";

/**
 * TaskFlow — client Pusher SERVEUR (Étape 16).
 *
 * ⚠️ Ne JAMAIS importer ce fichier depuis du code client : il lit
 * `PUSHER_SECRET`, qui ne doit jamais quitter le serveur.
 *
 * Design « best-effort » : si les variables Pusher sont absentes (dev local,
 * CI, preview), l'émission est un no-op silencieux. L'application reste
 * pleinement fonctionnelle sans temps réel — le temps réel est une couche
 * d'amélioration progressive, pas une dépendance critique.
 */

const config = {
  appId: process.env.PUSHER_APP_ID ?? "",
  key: process.env.PUSHER_KEY ?? "",
  secret: process.env.PUSHER_SECRET ?? "",
  cluster: process.env.PUSHER_CLUSTER ?? "mt1",
  useTLS: true,
};

const isPusherConfigured = Boolean(
  config.appId && config.key && config.secret,
);

let pusherInstance: Pusher | null = null;

/** Instance unique (lazy) ; `null` si Pusher non configuré. */
export function getPusherServer(): Pusher | null {
  if (!isPusherConfigured) return null;
  if (!pusherInstance) pusherInstance = new Pusher(config);
  return pusherInstance;
}

export const isRealtimeEnabled = isPusherConfigured;

/**
 * Émet un événement sur le canal PRIVÉ d'un board.
 * Fire-and-forget : une erreur réseau Pusher ne doit JAMAIS faire échouer
 * la mutation métier (le cache client se resynchronise au refocus).
 */
export async function emitBoardEvent<E extends RealtimeEvent>(
  boardId: string,
  event: E,
  actorId: string,
  payload: PayloadFor<E>,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return; // temps réel désactivé → no-op

  try {
    await pusher.trigger(`private-board-${boardId}`, event, {
      event,
      boardId,
      actorId,
      at: new Date().toISOString(),
      payload,
    });
  } catch (error) {
    // Log serveur uniquement ; jamais propagé à l'utilisateur.
    console.error(`[realtime] emit ${event} failed`, error);
  }
}
