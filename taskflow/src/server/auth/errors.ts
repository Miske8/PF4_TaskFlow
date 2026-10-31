/**
 * TaskFlow — erreurs applicatives serveur.
 *
 * Les services et la couche d'autorisation lèvent ces erreurs typées ;
 * les route handlers les convertissent en réponses HTTP via `httpErrorFromAppError`
 * (jamais de stack trace ni de message interne exposé au client).
 */

export class AppError extends Error {
  /** Code stable, exploitable côté client (i18n, tests). */
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/** Utilisateur non connecté (401). */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise.") {
    super("UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Connecté, mais interdit sur cette ressource (403).
 * ⚠️ Volontairement identique à un "introuvable" côté client : on ne divulgue
 * pas l'existence d'un board auquel l'utilisateur n'a pas accès.
 */
export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé à cette ressource.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

/** Ressource inexistante (404). */
export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/** Payload invalide après validation Zod (422). */
export class ValidationError extends AppError {
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/** Statut HTTP + corps JSON normalisé dérivés d'une AppError. */
export function httpErrorFromAppError(error: AppError): {
  status: number;
  body: { error: string; code: string; fieldErrors?: Record<string, string[]> };
} {
  const status =
    error instanceof UnauthorizedError
      ? 401
      : error instanceof ForbiddenError
        ? 403
        : error instanceof NotFoundError
          ? 404
          : error instanceof ValidationError
            ? 422
            : 500;

  return {
    status,
    body: {
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && error.fieldErrors
        ? { fieldErrors: error.fieldErrors }
        : {}),
    },
  };
}
