import { describe, expect, it } from "vitest";
import { canAll, isBoardMember, type BoardRoleValue } from "@/lib/permissions";

/**
 * TaskFlow — tests de la couche d'autorisation serveur (Étape 5 → Étape 19).
 * permissions.test.ts couvre déjà la matrice `can()` ; ce fichier complète
 * avec les helpers utilisés par requireBoardAccess / requireBoardOwner :
 * - `isBoardMember` : un extérieur (null) n'a JAMAIS accès aux données,
 * - `canAll` : conjonction d'actions (utilisée par les routes composites),
 * - cohérence rôle → droits sur les cas limites du produit.
 */

describe("isBoardMember", () => {
  it("accepte OWNER et MEMBER comme membres du board", () => {
    expect(isBoardMember("OWNER")).toBe(true);
    expect(isBoardMember("MEMBER")).toBe(true);
  });

  it("refuse un utilisateur sans membership (extérieur)", () => {
    expect(isBoardMember(null)).toBe(false);
    expect(isBoardMember(undefined)).toBe(false);
  });
});

describe("canAll — conjonction d'actions", () => {
  it("OWNER valide une conjunction incluant des actions sensibles", () => {
    expect(canAll("OWNER", ["board:update", "member:invite", "label:manage"])).toBe(true);
  });

  it("MEMBER échoue si UNE seule action est interdite (tout ou rien)", () => {
    // member:invite est réservé à l'owner → la conjunction entière tombe.
    expect(canAll("MEMBER", ["board:read", "card:create", "member:invite"])).toBe(false);
  });

  it("MEMBER réussit une conjunction 100% autorisée", () => {
    expect(canAll("MEMBER", ["board:read", "list:create", "card:update", "comment:create"])).toBe(true);
  });

  it("un extérieur échoue sur toute conjunction non vide", () => {
    const outsider = null as unknown as BoardRoleValue;
    expect(canAll(outsider, ["board:read"])).toBe(false);
  });

  it("une conjunction vide est trivialement vraie (garde logique)", () => {
    expect(canAll("MEMBER", [])).toBe(true);
  });
});

describe("règles produit critiques (récap portfolio)", () => {
  it("seul le owner supprime le board", () => {
    expect(canAll("OWNER", ["board:delete"])).toBe(true);
    expect(canAll("MEMBER", ["board:delete"])).toBe(false);
  });

  it("seul le owner gère les membres", () => {
    expect(canAll("OWNER", ["members:manage"])).toBe(true);
    expect(canAll("MEMBER", ["members:manage"])).toBe(false);
  });

  it("owner ET member partagent l'édition listes/cartes", () => {
    const shared = ["list:create", "list:update", "list:delete", "card:create", "card:update", "card:delete"];
    for (const role of ["OWNER", "MEMBER"] as const) {
      expect(canAll(role, shared)).toBe(true);
    }
  });
});
