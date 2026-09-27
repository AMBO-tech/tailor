/**
 * Accès prudent au `localStorage` (M-23, ARC-1).
 */

/** Clé de l'atelier courant, partagée avec l'en-tête `x-workshop-id` de l'API. */
export const WORKSHOP_ID_STORAGE_KEY = 'tailor_workshop_id';

/**
 * Lit et désérialise une valeur JSON du `localStorage` sans jamais lever d'exception.
 *
 * Une valeur absente renvoie le repli ; une valeur corrompue (JSON invalide, écrite
 * par une ancienne version ou modifiée à la main) est supprimée puis remplacée par
 * le repli, au lieu de faire planter l'application au démarrage.
 *
 * @param key - Clé du `localStorage`.
 * @param fallback - Valeur renvoyée si la clé est absente ou illisible.
 * @returns La valeur désérialisée, ou `fallback`.
 */
export function readStoredJson<T>(key: string, fallback: T): T {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Stockage indisponible (navigation privée...) : rien de plus à faire.
    }
    return fallback;
  }
}

/**
 * Identifiant de l'atelier actif (ou chaîne vide hors session).
 *
 * Sert à cloisonner les clés du cache TanStack Query par atelier : deux ateliers
 * utilisés successivement sur le même appareil ne partagent jamais de données.
 *
 * @returns L'identifiant de l'atelier courant, ou `''`.
 */
export function getActiveWorkshopId(): string {
  try {
    return localStorage.getItem(WORKSHOP_ID_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}
