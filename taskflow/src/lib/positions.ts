/**
 * TaskFlow — stratégie de positions « fractional indexing » (Étapes 3 & 9).
 *
 * Chaque List et Card porte un `order` flottant. Déplacer un élément entre
 * deux voisins = écrire UNE valeur (O(1)), sans renuméroter les autres :
 * idéal pour les optimistic updates et la concurrence temps réel.
 *
 * Règles :
 *  - insertion en tête        → first - GAP
 *  - insertion en queue       → last + GAP
 *  - insertion entre prev/next→ (prev + next) / 2
 *  - si l'intervalle est trop petit (dérive après des milliers de splits),
 *    on relinéarise la liste complète en 1..n (rare, amorti O(n)).
 */

/** Écart initial entre deux positions consécutives (marge de split). */
export const POSITION_GAP = 1000;

/** Seuil de densité : en dessous, un midpoint n'est plus représentable. */
export const MIN_ORDER_DELTA = 1e-8;

/** Position d'un nouvel élément en fin de liste (liste vide → GAP). */
export function orderAfterLast(lastOrder: number | undefined | null): number {
  return lastOrder === undefined || lastOrder === null
    ? POSITION_GAP
    : lastOrder + POSITION_GAP;
}

/** Position d'un nouvel élément en tête de liste. */
export function orderBeforeFirst(firstOrder: number | undefined | null): number {
  return firstOrder === undefined || firstOrder === null
    ? POSITION_GAP
    : firstOrder - POSITION_GAP;
}

/** Vrai si un midpoint strict entre prev et next est calculable. */
export function canInsertBetween(prev: number, next: number): boolean {
  return Number.isFinite(prev) && Number.isFinite(next) && next - prev > MIN_ORDER_DELTA;
}

/**
 * Position médiane entre le voisin précédent et le voisin suivant.
 * Les deux bornes peuvent être absentes (début / fin de liste).
 */
export function computeOrder(opts: {
  prev?: number | null;
  next?: number | null;
}): number {
  const { prev, next } = opts;

  if (prev != null && next != null) {
    if (!canInsertBetween(prev, next)) {
      // Appelant doit relinéariser (voir reorder service) — ici on renvoie
      // quand même le midpoint, la base reste cohérente à ±ε près.
      return (prev + next) / 2;
    }
    return (prev + next) / 2;
  }
  if (prev != null) return orderAfterLast(prev);
  if (next != null) return orderBeforeFirst(next);
  return POSITION_GAP; // liste vide
}

/**
 * Relinéarisation : repartitionne `orders` (triés ou non) en GAP, 2*GAP, 3*GAP…
 * Utilisé quand deux positions adjacentes sont trop proches pour un midpoint.
 */
export function linearizeOrders(count: number, gap: number = POSITION_GAP): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * gap);
}

/**
 * Calcule la nouvelle séquence d'orders après déplacement d'un élément.
 * Renvoie uniquement les éléments dont l'order change (écritures minimales),
 * ou `null` si une relinéarisation complète est nécessaire (densité atteinte).
 *
 * @param orders  tableau des orders actuels dans l'ordre d'affichage
 * @param fromIdx index actuel de l'élément déplacé
 * @param toIdx   index cible dans le tableau RETIRÉ de l'élément (insert before semantics)
 */
export function planReorder(
  orders: number[],
  fromIdx: number,
  toIdx: number,
): { id: number; order: number }[] | "relinearize" {
  if (fromIdx < 0 || fromIdx >= orders.length) return [];
  const moved = orders[fromIdx];
  const rest = orders.filter((_, i) => i !== fromIdx);
  const target = Math.max(0, Math.min(toIdx, rest.length));

  const prev = target > 0 ? rest[target - 1] : null;
  const next = target < rest.length ? rest[target] : null;

  if (prev != null && next != null && !canInsertBetween(prev, next)) {
    return "relinearize";
  }

  const newOrder = computeOrder({ prev, next });
  if (newOrder === moved) return []; // déplacement no-op

  // Écriture minimale : seul l'élément bougé change (garantie du fractional indexing).
  return [{ id: fromIdx, order: newOrder }];
}
