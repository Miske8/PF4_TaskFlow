import { describe, expect, it } from "vitest";
import {
  createCardSchema,
  updateCardSchema,
} from "@/lib/validations/card.schema";
import {
  attachLabelSchema,
  createLabelSchema,
  labelColorSchema,
} from "@/lib/validations/label.schema";

/**
 * TaskFlow — tests des schémas Zod cartes & labels (Étape 19).
 * Complète auth/board/list déjà couverts : on valide ici le contrat
 * partagé formulaires client ↔ routes API (cf. étapes 10 & 14).
 */

describe("createCardSchema", () => {
  it("accepte un titre normal et le trimme", () => {
    const result = createCardSchema.safeParse({ title: "  Faire les tests  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Faire les tests");
  });

  it("refuse un titre vide ou whitespace-only", () => {
    expect(createCardSchema.safeParse({ title: "" }).success).toBe(false);
    expect(createCardSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("refuse un titre de plus de 120 caractères", () => {
    expect(createCardSchema.safeParse({ title: "a".repeat(121) }).success).toBe(false);
    expect(createCardSchema.safeParse({ title: "a".repeat(120) }).success).toBe(true);
  });

  it("refuse un objet sans titre", () => {
    expect(createCardSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateCardSchema", () => {
  it("accepte une mise à jour partielle d'un seul champ", () => {
    expect(updateCardSchema.safeParse({ title: "Nouveau titre" }).success).toBe(true);
    expect(updateCardSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("refuse un PATCH vide (aucun champ à mettre à jour)", () => {
    const result = updateCardSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Aucun champ/);
    }
  });

  it("accepte une date ISO avec offset et refuse un format invalide", () => {
    expect(
      updateCardSchema.safeParse({ dueDate: "2026-11-15T12:00:00+01:00" }).success,
    ).toBe(true);
    expect(updateCardSchema.safeParse({ dueDate: "15/11/2026" }).success).toBe(false);
    expect(updateCardSchema.safeParse({ dueDate: null }).success).toBe(true); // retire l'échéance
  });

  it("plafonne la description à 5000 caractères", () => {
    expect(updateCardSchema.safeParse({ description: "d".repeat(5000) }).success).toBe(true);
    expect(updateCardSchema.safeParse({ description: "d".repeat(5001) }).success).toBe(false);
  });
});

describe("label schemas", () => {
  it("labelColorSchema n'accepte que l'enum Prisma LabelColor", () => {
    expect(labelColorSchema.safeParse("RED").success).toBe(true);
    expect(labelColorSchema.safeParse("MAGENTA").success).toBe(false);
    expect(labelColorSchema.safeParse("red").success).toBe(false); // casse stricte
  });

  it("createLabelSchema exige nom + couleur valides", () => {
    expect(createLabelSchema.safeParse({ name: "Urgent", color: "RED" }).success).toBe(true);
    expect(createLabelSchema.safeParse({ name: "", color: "RED" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ name: "Ok", color: "PINK" }).success).toBe(true);
    expect(createLabelSchema.safeParse({ name: "n".repeat(41), color: "BLUE" }).success).toBe(false);
  });

  it("attachLabelSchema exige un labelId cuid", () => {
    expect(attachLabelSchema.safeParse({ labelId: "ckyl9p6qj000008z9abcdefg" }).success).toBe(true);
    expect(attachLabelSchema.safeParse({ labelId: "pas-un-cuid" }).success).toBe(false);
    expect(attachLabelSchema.safeParse({}).success).toBe(false);
  });
});
