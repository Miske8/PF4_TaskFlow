import type { BoardRole } from "@prisma/client";

/**
 * TaskFlow — catalogue des événements temps réel Émis par les services après
 * chaque mutation réussie (Étape 16).
 *
 * ⚠️ Payloads volontairement MINIMAUX : uniquement des ids + champs de
 * réconciliation. Les données sensibles (contenu complet, membres, emails)
 * restent derrière l'API ; le client reçoit juste « ça a changé » et relit
 * via TanStack Query (autorisation revérifiée à chaque fetch).
 */

export const REALTIME_EVENTS = [
  "card:created",
  "card:updated",
  "card:moved",
  "card:deleted",
  "list:created",
  "list:updated",
  "list:moved",
  "list:deleted",
  "board:updated",
  "member:added",
  "member:removed",
] as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[number];

/* ------------------------------------------------------------------ */
/* Payloads typés                                                      */
/* ------------------------------------------------------------------ */

export interface CardCreatedPayload {
  cardId: string;
  listId: string;
  title: string;
}
export interface CardUpdatedPayload {
  cardId: string;
  listId: string;
}
export interface CardMovedPayload {
  cardId: string;
  fromListId: string;
  toListId: string;
}
export interface CardDeletedPayload {
  cardId: string;
  listId: string;
}
export interface ListCreatedPayload {
  listId: string;
  title: string;
}
export interface ListUpdatedPayload {
  listId: string;
  title?: string;
}
export interface ListMovedPayload {
  listId: string;
}
export interface ListDeletedPayload {
  listId: string;
}
export interface BoardUpdatedPayload {
  boardId: string;
  name?: string;
}
export interface MemberAddedPayload {
  userId: string;
  role: BoardRole;
}
export interface MemberRemovedPayload {
  userId: string;
}

type EventPayloadMap = {
  "card:created": CardCreatedPayload;
  "card:updated": CardUpdatedPayload;
  "card:moved": CardMovedPayload;
  "card:deleted": CardDeletedPayload;
  "list:created": ListCreatedPayload;
  "list:updated": ListUpdatedPayload;
  "list:moved": ListMovedPayload;
  "list:deleted": ListDeletedPayload;
  "board:updated": BoardUpdatedPayload;
  "member:added": MemberAddedPayload;
  "member:removed": MemberRemovedPayload;
};

/** Événement tel que reçu côté client (enveloppe stable). */
export type RealtimeMessage<E extends RealtimeEvent = RealtimeEvent> = {
  event: E;
  boardId: string;
  actorId: string;
  at: string; // ISO
  payload: EventPayloadMap[E];
};

/** Type exact du payload d'un événement donné. */
export type PayloadFor<E extends RealtimeEvent> = EventPayloadMap[E];
