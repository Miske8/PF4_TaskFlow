import type { NextAuthConfig } from "next-auth";

/**
 * TaskFlow — configuration Auth.js « légère », sans aucune dépendance
 * base de données : importable dans `src/middleware.ts` (edge runtime).
 * La version complète (provider Credentials + Prisma) est dans `auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      // Pages publiques : rediriger un utilisateur connecté hors de /login et /register.
      const isPublicAuthPage = pathname === "/login" || pathname === "/register";
      if (isPublicAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }

      // Racine : selon la session, dashboard ou login.
      if (pathname === "/") {
        return Response.redirect(
          new URL(isLoggedIn ? "/dashboard" : "/login", request.nextUrl),
        );
      }

      // Toutes les autres pages (dashboard, boards…) sont privées.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id as string;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id;
      return session;
    },
  },
} satisfies NextAuthConfig;
