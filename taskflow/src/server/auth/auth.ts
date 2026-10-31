import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { loginSchema } from "@/lib/validations/auth.schema";
import { authConfig } from "@/server/auth/config";

/**
 * TaskFlow — configuration Auth.js v5 (NextAuth).
 * Stratégie JWT (compatible middleware edge) + provider Credentials.
 * Le hash bcrypt est vérifié côté serveur uniquement ; `passwordHash`
 * ne quitte jamais la couche `server/`.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        // Validation Zod du payload (défense en profondeur : la Server Action
        // d'inscription valide déjà, et le formulaire login aussi).
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Seuls ces champs entrent dans le token JWT — jamais passwordHash.
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
