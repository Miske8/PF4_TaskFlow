import type { BoardRole } from "@prisma/client";

/**
 * TaskFlow — matrice des permissions du domaine.
 *
 * ⚠️ Couche pure : aucun import serveur (ni Prisma, ni session) → testable
 * unitairement et réutilisable côté client pour griser des boutons uniquement
 * (la vraie sécurité reste TOUJOURS vérifiée côté serveur via `permissions.ts`).
 */

export type ActorRole = BoardRole | null; // null = utilisateur extérieur au board

/** Actions possibles sur un board (RBAC simplifié à 2 rôles). */
export type BoardAction =
  | "board:read" // voir le board, ses listes, cartes, membres
  | "board:update" // renommer / modifier la description
  | "board:delete" // supprimer le board        → OWNER uniquement
  | "list:create" // créer une colonne
  | "list:update" // renommer / réordonner
  | "list:delete" // supprimer une colonne
  | "card:create" // créer une carte
  | "card:update" // éditer / déplacer une carte
  | "card:delete" // supprimer une carte
  | "comment:create" // commenter une carte
  | "label:manage" // créer/attacher des labels
  | "member:invite" // inviter un membre       → OWNER uniquement
  | "member:remove" // retirer un membre       → OWNER uniquement
  | "members:manage"; // voir la gestion des membres → OWNER uniquement

/**
 * Matrice de référence : ce que chaque rôle peut faire.
 * Règles produit demandées :
 *  - seul l'owner supprime le board ;
 *  - owner ET member voient/modifient listes et cartes ;
 *  - seul l'owner invite/retire des membres.
 */
const PERMISSION_MATRIX: Record<BoardRole | "anonymous", BoardAction[]> = {
  anonymous: [],
  OWNER: [
    "board:read",
    "board:update",
    "board:delete",
    "list:create",
    "list:update",
    "list:delete",
    "card:create",
    "card:update",
    "card:delete",
    "comment:create",
    "label:manage",
    "member:invite",
    "member:remove",
    "members:manage",
  ],
  MEMBER: [
    "board:read",
    "list:create",
    "list:update",
    "list:delete",
    "card:create",
    "card:update",
    "card:delete",
    "comment:create",
    "label:manage",
  ],
};

/** La question centrale : « cet acteur a-t-il cette action ? » */
export function can(role: ActorRole, action: BoardAction): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[role].includes(action);
}

/** Version « ensemble » pour vérifier plusieurs actions d'un coup (ex. UI). */
export function canAll(role: ActorRole, actions: BoardAction[]): boolean {
  return actions.every((action) => can(role, action));
}

/** L'acteur est-il membre (ou owner) du board ? */
export function isBoardMember(role: ActorRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}
