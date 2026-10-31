import { describe, expect, it } from "vitest";
import {
  dateInputToIso,
  formatDueLabel,
  getDueStatus,
  toDateInputValue,
} from "@/lib/dates";

/**
 * TaskFlow — tests des helpers d'échéance (Étape 14).
 * On fixe « aujourd'hui » en relatif pour rester déterministe.
 */

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe("getDueStatus", () => {
  it("retourne none sans échéance", () => {
    expect(getDueStatus(null)).toBe("none");
    expect(getDueStatus(undefined)).toBe("none");
  });

  it("overdue si la date est passée", () => {
    expect(getDueStatus(isoOffset(-1))).toBe("overdue");
    expect(getDueStatus(isoOffset(-30))).toBe("overdue");
  });

  it("today si échéance aujourd'hui", () => {
    expect(getDueStatus(isoOffset(0))).toBe("today");
  });

  it("soon dans les 3 prochains jours, later au-delà", () => {
    expect(getDueStatus(isoOffset(2))).toBe("soon");
    expect(getDueStatus(isoOffset(10))).toBe("later");
  });
});

describe("formatDueLabel", () => {
  it("libellés relatifs courts", () => {
    expect(formatDueLabel(isoOffset(0))).toBe("Aujourd'hui");
    expect(formatDueLabel(isoOffset(-1))).toBe("Hier");
    expect(formatDueLabel(isoOffset(1))).toBe("Demain");
    expect(formatDueLabel(isoOffset(5))).toBe("Dans 5 j");
  });
});

describe("toDateInputValue / dateInputToIso", () => {
  it("round-trip stable yyyy-MM-dd", () => {
    const value = "2026-10-31";
    const iso = dateInputToIso(value);
    expect(toDateInputValue(iso)).toBe(value);
  });

  it("dateInputToIso utilise midi local (pas de décalage jour)", () => {
    const iso = dateInputToIso("2026-01-15");
    expect(new Date(iso).getDate()).toBe(15);
  });

  it("toDateInputValue tolère null/undefined", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });
});
