import { useEffect, useState } from 'react';

/** Délai par défaut avant de lancer une recherche (PERF-3). */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Renvoie `value` seulement après `delayMs` millisecondes sans changement.
 *
 * Utilisé pour la recherche de clientes : une requête par pause de saisie au
 * lieu d'une requête par frappe (important en 3G).
 *
 * @param value - Valeur saisie, mise à jour à chaque frappe.
 * @param delayMs - Délai d'inactivité avant propagation.
 * @returns La dernière valeur stable.
 */
export function useDebounce<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
