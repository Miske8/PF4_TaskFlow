import { describe, expect, it } from "vitest";
import { can, canAll, isBoardMember, type BoardAction } from "@/lib/permissions";

/**
 * TaskFlow — tests de la matrice de permissions (Étape 5).
 * Couvrent les règles produit : seul l'owner supprime le board et gère les membres ;
 * member peut créer/modifier listes et cartes ; extérieur ne peut rien.
 */

describe("permissions — matrice RBAC", () => {
  it("OWNER peut tout faire", () => {
    const ownerActions: BoardAction[] = [
      "board:read",
      "board:update",
      "board:delete",
      "list:create",
      "card:update",
      "member:invite",
      "member:remove",
    ];
    for (const action of ownerActions) {
      expect(can("OWNER", action)).toBe(true);
    }
  });

  it("MEMBER peut lire et modifier listes/cartes mais PAS supprimer le board", () => {
    expect(can("MEMBER", "board:read")).toBe(true);
    expect(can("MEMBER", "list:create")).toBe(true);
    expect(can("MEMBER", "list:update")).toBe(true);
    expect(can("MEMBER", "list:delete")).toBe(true);
    expect(can("MEMBER", "card:create")).toBe(true);
    expect(can("MEMBER", "card:update")).toBe(true);
    expect(can("MEMBER", "card:delete")).toBe(true);
    expect(can("MEMBER", "comment:create")).toBe(true);

    expect(can("MEMBER", "board:delete")).toBe(false); // ⭐ règle clé
  });

  it("MEMBER ne peut NI inviter NI retirer des membres", () => {
    expect(can("MEMBER", "member:invite")).toBe(false); // ⭐ règle clé
    expect(can("MEMBER", "member:remove")).toBe(false); // ⭐ règle clé
    expect(can("MEMBER", "members:manage")).toBe(false);
  });

  it("un utilisateur extérieur (null) ne peut rien faire", () => {
    const all: BoardAction[] = [
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
    ];
    for (const action of all) {
      expect(can(null, action)).toBe(false); // ⭐ aucune fuite possible
    }
  });

  it("canAll exige toutes les actions", () => {
    expect(canAll("MEMBER", ["board:read", "card:create"])).toBe(true);
    expect(canAll("MEMBER", ["board:read", "board:delete"])).toBe(false);
    expect(canAll(null, ["board:read"])).toBe(false);
  });

  it("isBoardMember reconnaît OWNER et MEMBER, pas null", () => {
    expect(isBoardMember("OWNER")).toBe(true);
    expect(isBoardMember("MEMBER")).toBe(true);
    expect(isBoardMember(null)).toBe(false);
  });
});
