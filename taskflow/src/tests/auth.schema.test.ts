import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, zodFieldErrors } from "@/lib/validations/auth.schema";

describe("registerSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ADA@exemple.com",
    password: "Passw0rd123",
    confirmPassword: "Passw0rd123",
  };

  it("accepte une inscription valide et normalise l'email en minuscules", () => {
    const result = registerSchema.parse(valid);
    expect(result.email).toBe("ada@exemple.com");
  });

  it("refuse un mot de passe trop court", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Ab1", confirmPassword: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("refuse un mot de passe sans chiffre", () => {
    const result = registerSchema.safeParse({ ...valid, password: "abcdefghij", confirmPassword: "abcdefghij" });
    expect(result.success).toBe(false);
  });

  it("refuse les mots de passe non identiques (path confirmPassword)", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Other12345" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFieldErrors(result.error)).toHaveProperty("confirmPassword");
    }
  });

  it("refuse un email invalide", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepte un couple email/mot de passe minimal", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("normalise l'email en minuscules", () => {
    const r = loginSchema.parse({ email: "A@B.CO", password: "x" });
    expect(r.email).toBe("a@b.co");
  });

  it("refuse un mot de passe vide", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
