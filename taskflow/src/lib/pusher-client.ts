"use client";

import PusherClient from "pusher-js";

/**
 * TaskFlow — client Pusher NAVIGATEUR (Étape 16).
 * Singleton partagé par tous les hooks temps réel.
 *
 * ⚠️ Côté client on n'expose QUE la clé publique (`NEXT_PUBLIC_PUSHER_KEY`)
 * et le cluster. Le `PUSHER_SECRET` reste serveur ; l'accès aux canaux
 * privés est signé par `/api/pusher/auth` (authorizer ci-dessous), qui
 * vérifie la session ET l'appartenance au board.
 */

let instance: PusherClient | null = null;

export function isPusherClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY);
}

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null; // pas configuré → le realtime est un no-op côté UI

  if (!instance) {
    instance = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      useTLS: true,
      authorizer: (channel: string, options: unknown) => {
        // Canaux privés/sprésents → signature serveur obligatoire.
        const privateChannels = /^private-|^presence-/.test(channel);
        if (!privateChannels) return undefined;
        void options;
        return {
          authorizeSocket: async (
            authOptions: { socket_id: string; channel_name: string },
            callback: (error: string | null, data?: unknown) => void,
          ) => {
            try {
              const res = await fetch("/api/pusher/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin", // cookie de session Auth.js inclus
                body: JSON.stringify(authOptions),
              });
              if (!res.ok) {
                callback(`Autorisation refusée (${res.status})`, undefined);
                return;
              }
              const data = await res.json();
              callback(null, data);
            } catch (error) {
              callback(error instanceof Error ? error.message : "Erreur réseau", undefined);
            }
          },
        };
      },
    });
  }
  return instance;
}
