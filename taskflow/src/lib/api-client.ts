/**
 * TaskFlow — fetcher HTTP typé pour TanStack Query (côté client uniquement).
 * Enveloppe `fetch` en conventionnant :
 *  - requêtes JSON, credentials inclus (cookie de session),
 *  - erreurs enrichies du corps normalisé `{ error, code, fieldErrors }`,
 *  - helper `delete` qui tolère un 404 (idempotent).
 */

import type { ApiErrorBody } from "@/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.error ?? `Erreur HTTP ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.code ?? "UNKNOWN";
    this.fieldErrors = body.fieldErrors;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = await res.json();
    } catch {
      /* réponse non-JSON : on garde le statut seul */
    }
    throw new ApiClientError(res.status, body);
  }

  // 204 ou corps vide → undefined typé
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

/** Message lisible, stable, pour affichage (toasts, ErrorState…). */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}
