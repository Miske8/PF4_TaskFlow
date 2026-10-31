import { describe, expect, it } from "vitest";
import {
  MIN_ORDER_DELTA,
  POSITION_GAP,
  canInsertBetween,
  computeOrder,
  linearizeOrders,
  orderAfterLast,
  orderBeforeFirst,
  planReorder,
} from "@/lib/positions";

/**
 * TaskFlow — tests approfondis de la stratégie de positions (Étape 19).
 * positions.test.ts couvre les cas nominaux ; ce fichier ajoute les cas
 * limites qui garantissent la STABILITÉ du drag & drop en production :
 * densité maximale, no-op, clamping d'index, invariant de tri.
 */

describe("computeOrder — cas limites", () => {
  it("liste vide → position initiale GAP", () => {
    expect(computeOrder({ prev: null, next: null })).toBe(POSITION_GAP);
  });

  it("insertion en tête sans voisin précédent → first - GAP", () => {
    expect(computeOrder({ prev: null, next: 5000 })).toBe(5000 - POSITION_GAP);
  });

  it("insertion en queue sans voisin suivant → last + GAP", () => {
    expect(computeOrder({ prev: 5000, next: null })).toBe(5000 + POSITION_GAP);
  });

  it("midpoint exact entre deux bornes", () => {
    expect(computeOrder({ prev: 1000, next: 2000 })).toBe(1500);
  });

  it("bornes négatives (tête après plusieurs insertions before) restent cohérentes", () => {
    const order = computeOrder({ prev: null, next: -9000 });
    expect(order).toBeLessThan(-9000);
    expect(Number.isFinite(order)).toBe(true);
  });

  it("midpoint successif converge vers le seuil de densité", () => {
    let prev = 0;
    let next = 1;
    for (let i = 0; i < 60; i++) {
      const mid = computeOrder({ prev, next });
      expect(mid).toBeGreaterThan(prev);
      expect(mid).toBeLessThan(next);
      // soit représentable, soit on atteint le seuil → détection possible
      if (!canInsertBetween(prev, next)) break;
      if (i % 2 === 0) next = mid;
      else prev = mid;
    }
  });
});

describe("canInsertBetween — seuil de densité", () => {
  it("vrai si l'écart est supérieur au seuil", () => {
    expect(canInsertBetween(0, MIN_ORDER_DELTA * 2)).toBe(true);
  });

  it("faux si l'écart est au niveau ou sous le seuil", () => {
    expect(canInsertBetween(0, MIN_ORDER_DELTA)).toBe(false);
    expect(canInsertBetween(0, MIN_ORDER_DELTA / 2)).toBe(false);
  });

  it("faux sur des valeurs non finies (NaN / Infinity)", () => {
    expect(canInsertBetween(NaN, 1)).toBe(false);
    expect(canInsertBetween(0, Infinity)).toBe(false);
  });
});

describe("linearizeOrders", () => {
  it("produit GAP, 2*GAP, … strictement croissants", () => {
    const orders = linearizeOrders(4);
    expect(orders).toEqual([1000, 2000, 3000, 4000]);
  });

  it("gap personnalisable et liste vide → []", () => {
    expect(linearizeOrders(0)).toEqual([]);
    expect(linearizeOrders(2, 100)).toEqual([100, 200]);
  });
});

describe("planReorder — écriture minimale & garde-fous", () => {
  const base = [1000, 2000, 3000, 4000];

  it("déplacement réel → UN SEUL changement d'order (écriture O(1))", () => {
    const plan = planReorder(base, 0, 2); // 1er élément vers la position 3
    expect(Array.isArray(plan)).toBe(true);
    if (Array.isArray(plan)) {
      expect(plan).toHaveLength(1);
      expect(plan[0].id).toBe(0);
      // nouvelle position entre 3000 et 4000
      expect(plan[0].order).toBeGreaterThan(3000);
      expect(plan[0].order).toBeLessThan(4000);
    }
  });

  it("no-op (même index) → aucun UPDATE émis", () => {
    const plan = planReorder(base, 1, 1);
    expect(plan).toEqual([]);
  });

  it("index source hors bornes → plan vide (pas de crash)", () => {
    expect(planReorder(base, -1, 2)).toEqual([]);
    expect(planReorder(base, 99, 2)).toEqual([]);
  });

  it("toIdx trop grand est clampé en fin de liste", () => {
    const plan = planReorder(base, 0, 99);
    expect(Array.isArray(plan)).toBe(true);
    if (Array.isArray(plan)) {
      expect(plan[0].order).toBeGreaterThan(4000); // placé après le dernier
    }
  });

  it("densité atteinte → 'relinearize' signalé à l'appelant", () => {
    const dense = [1, 1 + MIN_ORDER_DELTA / 4, 2, 3];
    const plan = planReorder(dense, 3, 1); // insérer entre les deux collés
    expect(plan).toBe("relinearize");
  });

  it("invariant : l'order proposé respecte toujours prev < new < next", () => {
    const plan = planReorder(base, 3, 0); // dernier → premier
    expect(Array.isArray(plan)).toBe(true);
    if (Array.isArray(plan)) {
      expect(plan[0].order).toBeLessThan(1000); // avant l'ancien premier
    }
  });
});

describe("orderAfterLast / orderBeforeFirst", () => {
  it("liste vide → GAP dans les deux sens", () => {
    expect(orderAfterLast(null)).toBe(POSITION_GAP);
    expect(orderBeforeFirst(undefined)).toBe(POSITION_GAP);
  });

  it("borne existante → décalage de ±GAP", () => {
    expect(orderAfterLast(2500)).toBe(3500);
    expect(orderBeforeFirst(2500)).toBe(1500);
  });
});
