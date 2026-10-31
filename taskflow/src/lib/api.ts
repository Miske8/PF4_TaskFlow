import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, httpErrorFromAppError } from "@/server/auth/errors";

/**
 * TaskFlow — utilitaires pour les route handlers API.
 * Enveloppe chaque handler : validation Zod + conversion propre des erreurs
 * applicatives en réponses HTTP (jamais de stack trace exposée).
 */

export function jsonError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const { status, body } = httpErrorFromAppError(error);
    return NextResponse.json(body, { status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Données invalides.",
        code: "VALIDATION_ERROR",
        fieldErrors: error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    { error: "Erreur interne du serveur.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

/** Parse le corps JSON d'une requête avec un schéma Zod (422 si invalide). */
export async function parseBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Corps de requête JSON invalide.");
  }
  return schema.parse(raw); // ZodError → converti par jsonError
}

/** Paramètres dynamiques typés (`{ params: Promise<{ boardId: string }> }` en Next 15+). */
export async function parseParams<T extends Record<string, string>>(
  params: Promise<T>,
): Promise<T> {
  return params;
}
