import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

/**
 * TaskFlow — protection des pages privées à la edge runtime.
 * Seule la config « légère » (sans Prisma) est importée ici ; les routes API
 * complètes passent par `@/server/auth/auth`.
 * En Auth.js v5, `NextAuth(config)` renvoie directement le handler middleware.
 */
export default NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
