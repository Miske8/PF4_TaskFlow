import { describe, expect, it } from "vitest";
import {
  createBoardSchema,
  updateBoardSchema,
} from "@/lib/validations/board.schema";

/**
 * TaskFlow — tests de validation des boards (Étape 7).
 * Ces schémas sont le contrat partagé formulaires client ↔ routes API.
 */

describe("createBoardSchema", () => {
  it("accepte un nom valide et trimme les espaces", () => {
    const result = createBoardSchema.parse({ name: "  Sprint 12  " });
    expect(result.name).toBe("Sprint 12");
    expect(result.description).toBeUndefined();
  });

  it("convertit une description vide en undefined", () => {
    const result = createBoardSchema.parse({ name: "OK", description: "" });
    expect(result.description).toBeUndefined();
  });

  it("refuse un nom vide ou uniquement des espaces", () => {
    expect(createBoardSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createBoardSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("refuse un nom de plus de 100 caractères", () => {
    const result = createBoardSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("refuse une description de plus de 500 caractères", () => {
    const result = createBoardSchema.safeParse({
      name: "Ok",
      description: "d".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBoardSchema", () => {
  it("accepte la mise à jour du nom seul", () => {
    expect(updateBoardSchema.safeParse({ name: "Nouveau nom" }).success).toBe(true);
  });

  it("accepte isArchived seul", () => {
    expect(updateBoardSchema.safeParse({ isArchived: true }).success).toBe(true);
  });

  it("refuse un payload vide (rien à mettre à jour)", () => {
    expect(updateBoardSchema.safeParse({}).success).toBe(false);
  });

  it("refuse un nom trop long", () => {
    expect(updateBoardSchema.safeParse({ name: "x".repeat(120) }).success).toBe(false);
  });
});
