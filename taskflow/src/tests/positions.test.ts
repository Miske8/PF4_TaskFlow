import { describe, expect, it } from "vitest";
import {
  POSITION_GAP,
  canInsertBetween,
  computeOrder,
  linearizeOrders,
  orderAfterLast,
  orderBeforeFirst,
  planReorder,
} from "@/lib/positions";

/**
 * TaskFlow — tests de la stratégie de positions (Étape 9).
 * Ces fonctions sont LE contrat partagé entre services reorder et hooks
 * optimistes : elles garantissent un réordonnancement stable en base.
 */

describe("computeOrder (fractional indexing)", () => {
  it("insère au milieu entre deux voisins", () => {
    expect(computeOrder({ prev: 1000, next: 2000 })).toBe(1500);
  });

  it("insère en tête avant le premier élément", () => {
    expect(computeOrder({ prev: null, next: 1000 })).toBe(1000 - POSITION_GAP);
  });

  it("insère en queue après le dernier élément", () => {
    expect(computeOrder({ prev: 3000, next: null })).toBe(3000 + POSITION_GAP);
  });

  it("donne GAP dans une liste vide", () => {
    expect(computeOrder({ prev: null, next: null })).toBe(POSITION_GAP);
  });

  it("accepte des splits successifs sans collision", () => {
    let a = 1000;
    let b = 2000;
    for (let i = 0; i < 40; i++) {
      const mid = computeOrder({ prev: a, next: b });
      expect(mid).toBeGreaterThan(a);
      expect(mid).toBeLessThan(b);
      // On resserre toujours d'un côté → cas pathologique simulé
      if (i % 2 === 0) b = mid;
      else a = mid;
    }
  });
});

describe("canInsertBetween / densité", () => {
  it("détecte un intervalle trop petit pour un midpoint", () => {
    expect(canInsertBetween(1, 1 + 1e-12)).toBe(false);
    expect(canInsertBetween(1, 2)).toBe(true);
  });

  it("refuse les intervalles invalides (next <= prev)", () => {
    expect(canInsertBetween(2, 1)).toBe(false);
    expect(canInsertBetween(1, 1)).toBe(false);
  });
});

describe("linearizeOrders", () => {
  it("repartition en GAP, 2*GAP, …", () => {
    expect(linearizeOrders(3)).toEqual([1000, 2000, 3000]);
    expect(linearizeOrders(0)).toEqual([]);
  });
});

describe("orderAfterLast / orderBeforeFirst", () => {
  it("liste vide → GAP par défaut", () => {
    expect(orderAfterLast(null)).toBe(POSITION_GAP);
    expect(orderBeforeFirst(undefined)).toBe(POSITION_GAP);
  });
});

describe("planReorder (écriture minimale)", () => {
  it("déplace un élément vers la fin : seul l'élément bougé change", () => {
    const orders = [1000, 2000, 3000];
    const plan = planReorder(orders, 0, 2); // element 0 → dernière position
    expect(plan).not.toBe("relinearize");
    if (plan !== "relinearize") {
      expect(plan.length).toBe(1);
      expect(plan[0].id).toBe(0);
      expect(plan[0].order).toBeGreaterThan(3000);
    }
  });

  it("no-op quand rien ne bouge", () => {
    expect(planReorder([1000, 2000], 0, 0)).toEqual([]);
  });

  it("demande une relinéarisation si le voisinage est saturé", () => {
    const dense = [1, 1 + 1e-12, 2];
    expect(planReorder(dense, 2, 1)).toBe("relinearize");
  });
});
