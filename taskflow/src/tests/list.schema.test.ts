import { describe, expect, it } from "vitest";
import {
  createListSchema,
  renameListSchema,
  reorderListsSchema,
} from "@/lib/validations/list.schema";

/**
 * TaskFlow — tests du contrat Zod des colonnes (Étape 9).
 * Le même schéma valide les formulaires client ET les bodies des routes API.
 */

describe("createListSchema", () => {
  it("trimme et accepte un titre valide", () => {
    const r = createListSchema.parse({ title: "  En cours  " });
    expect(r.title).toBe("En cours");
    expect(r.afterListId).toBeUndefined();
  });

  it("refuse un titre vide ou whitespace-only", () => {
    expect(createListSchema.safeParse({ title: "" }).success).toBe(false);
    expect(createListSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("refuse plus de 80 caractères (limite VarChar du schéma Prisma)", () => {
    expect(createListSchema.safeParse({ title: "a".repeat(81) }).success).toBe(false);
    expect(createListSchema.safeParse({ title: "a".repeat(80) }).success).toBe(true);
  });

  it("accepte un afterListId cuid et refuse un id invalide", () => {
    const cuid = "ckyl9p6qj000008z9ldk7l6bb";
    expect(createListSchema.safeParse({ title: "OK", afterListId: cuid }).success).toBe(true);
    expect(createListSchema.safeParse({ title: "OK", afterListId: "not-a-cuid" }).success).toBe(false);
  });
});

describe("renameListSchema", () => {
  it("exige un titre non vide", () => {
    expect(renameListSchema.safeParse({ title: "Fait" }).success).toBe(true);
    expect(renameListSchema.safeParse({ title: " " }).success).toBe(false);
  });
});

describe("reorderListsSchema", () => {
  it("exige au moins un id", () => {
    expect(reorderListsSchema.safeParse({ listIds: [] }).success).toBe(false);
  });

  it("valide une séquence de cuids", () => {
    const ids = ["ckyl9p6qj000008z9ldk7l6bb", "ckyl9p6qj000108z9ldk7l6bc"];
    expect(reorderListsSchema.parse({ listIds: ids }).listIds).toEqual(ids);
  });

  it("refuse des ids non-cuid injectés", () => {
    expect(reorderListsSchema.safeParse({ listIds: ["../../etc/passwd"] }).success).toBe(false);
  });
});
