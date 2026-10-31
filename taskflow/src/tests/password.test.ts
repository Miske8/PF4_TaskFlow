import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("bcrypt password helpers", () => {
  it("produit un hash différent du mot de passe en clair", async () => {
    const hash = await hashPassword("Passw0rd123");
    expect(hash).not.toBe("Passw0rd123");
    expect(hash.startsWith("$2")).toBe(true); // préfixe bcrypt
  });

  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword("Passw0rd123");
    expect(await verifyPassword("Passw0rd123", hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("Passw0rd123");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("génère des salts uniques (deux hashes différents pour le même mot de passe)", async () => {
    const [h1, h2] = await Promise.all([hashPassword("Passw0rd123"), hashPassword("Passw0rd123")]);
    expect(h1).not.toBe(h2);
  });
});
