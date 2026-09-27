/**
 * Pagination par curseur des listes (`GET /orders`, `/clients`, `/payments`).
 *
 * Avec `?limit=` (et `?cursor=` à partir de la 2e page), l'API répond
 * `{ data, nextCursor }` ; sans ces paramètres, elle garde l'ancien format
 * (tableau complet). Les deux formats sont acceptés ici.
 */
import type { CursorPage } from '@types';

/** Taille d'une page de liste (« Charger plus » ajoute la suivante). */
export const LIST_PAGE_SIZE = 30;

/**
 * Normalise une réponse de liste en page `{ data, nextCursor }`.
 * Un tableau (ancien format) est une page unique, sans suite.
 */
export function toCursorPage<T>(payload: T[] | CursorPage<T> | null | undefined): CursorPage<T> {
  if (Array.isArray(payload)) return { data: payload, nextCursor: null };
  if (payload && Array.isArray(payload.data)) {
    return { data: payload.data, nextCursor: payload.nextCursor ?? null };
  }
  return { data: [], nextCursor: null };
}

/**
 * Construit l'URL d'une page : filtres existants, puis `limit` et `cursor`.
 *
 * @param path - Chemin de la liste (ex. `/orders`).
 * @param filters - Filtres facultatifs (les valeurs vides sont ignorées).
 * @param cursor - Curseur renvoyé par la page précédente (absent pour la 1re page).
 */
export function buildPageUrl(
  path: string,
  filters: Record<string, string | undefined>,
  cursor?: string,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  params.set('limit', String(LIST_PAGE_SIZE));
  if (cursor) params.set('cursor', cursor);
  return `${path}?${params.toString()}`;
}
