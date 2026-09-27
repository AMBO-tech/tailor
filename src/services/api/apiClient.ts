import { isAbortError } from '@utils/errors';

/**
 * Erreur d'appel à l'API. Le message reste celui affiché jusqu'ici ; `status`
 * (0 = pas de réponse : hors ligne, délai dépassé) permet de distinguer une
 * erreur réseau/serveur (à retenter) d'un refus métier (4xx).
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Statut HTTP « trop de requêtes » (compte verrouillé, limitation de débit). */
export const TOO_MANY_REQUESTS = 429;

/**
 * Message d'erreur lisible depuis le corps `{ statusCode, message, error }` :
 * les erreurs de validation renvoient un tableau de messages.
 */
export function extractErrorMessage(body: unknown): string | undefined {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join(' · ') || undefined;
  return typeof message === 'string' && message ? message : undefined;
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('tailor_token');
  const workshopId = localStorage.getItem('tailor_workshop_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(workshopId ? { 'x-workshop-id': workshopId } : {}),
  };
}

export function handleUnauthorizedOrRevoked(): void {
  localStorage.removeItem('tailor_token');
  localStorage.removeItem('tailor_user');
  localStorage.removeItem('tailor_workshops');
  localStorage.removeItem('tailor_workshop');
  localStorage.removeItem('tailor_workshop_id');
  window.location.href = '/login';
}

/** Options propres à `request` (en plus de celles de `fetch`). */
export interface RequestHooks {
  /**
   * Traitement d'un 401 à la place de la déconnexion de l'atelier (ex. session
   * d'administration séparée, ou écran de connexion où 401 = identifiants faux).
   */
  onUnauthorized?: () => void;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  hooks: RequestHooks = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      const errData = await res.json().catch(() => ({}));
      if (hooks.onUnauthorized) {
        hooks.onUnauthorized();
      } else if (
        errData.message?.includes('révoqué') ||
        errData.message?.includes('introuvable') ||
        errData.message?.includes('expiré')
      ) {
        handleUnauthorizedOrRevoked();
      }
      throw new ApiError(extractErrorMessage(errData) || 'Session expirée ou accès non autorisé', 401);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const fallback =
        res.status === TOO_MANY_REQUESTS
          ? 'Trop de tentatives : compte temporairement verrouillé. Réessayez dans quelques minutes.'
          : `Erreur serveur (${res.status})`;
      throw new ApiError(extractErrorMessage(errData) || fallback, res.status);
    }

    return res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (isAbortError(err)) {
      throw new ApiError("Délai d'attente réseau dépassé (connexion instable)", 0);
    }
    // fetch rejette avec TypeError quand aucune réponse n'arrive (hors ligne, DNS...).
    if (err instanceof TypeError) {
      throw new ApiError(err.message || 'Réseau indisponible', 0);
    }
    throw err;
  }
}
