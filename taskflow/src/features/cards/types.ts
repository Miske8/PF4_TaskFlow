/**
 * TaskFlow — types du domaine "cartes", alignés sur les DTOs de
 * /api/lists/[listId]/cards et /api/cards/[cardId] (cf. card.service.ts).
 * NB : dates sérialisées en ISO par l'API JSON.
 */

export type CardLabelDto = { id: string; name: string; color: string };

export type CardDto = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // ISO
  completedAt: string | null; // ISO
  order: number;
  listId: string;
  createdAt: string;
  updatedAt: string;
  labels: CardLabelDto[];
};

export type CardResponse = { card: CardDto };
export type OkResponse = { ok: true };
