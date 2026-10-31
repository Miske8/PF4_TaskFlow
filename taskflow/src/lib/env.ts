import { z } from "zod";

/**
 * TaskFlow — validation centralisée des variables d'environnement (Zod).
 * Échoue au démarrage (fail-fast) si une variable serveur requise est absente.
 *
 * NB : les clés Pusher sont validées à l'Étape 16 (temps réel) ; elles ne sont
 * pas requises pour l'authentification ni le CRUD.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars (openssl rand -base64 32)"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional().default("mt1"),
});

export const env = serverSchema.parse(process.env);

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});
