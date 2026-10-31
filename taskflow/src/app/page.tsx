/**
 * TaskFlow — racine du site.
 * La redirection selon la session est gérée par le proxy Auth.js (`src/app/proxy.ts`) :
 * connecté → /dashboard, sinon → /login. Cette fallback couvre les accès API/directs.
 */
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
