import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

/**
 * TaskFlow — extension des types Auth.js : l'id utilisateur est disponible
 * sur la session côté serveur ET côté client (stratégie JWT).
 */
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
  }
}
