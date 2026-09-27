/* eslint-disable no-console -- point d'accès unique à la console, voir TSDoc ci-dessous */

/**
 * Journalisation centralisée de l'application.
 *
 * Tous les messages de diagnostic passent par ce module plutôt que par
 * `console.*` directement : cela permet de brancher plus tard un outil de
 * suivi d'erreurs (Sentry...) en un seul endroit, et d'appliquer la règle
 * ESLint `no-console` au reste du code.
 *
 * - `info` : uniquement en développement (bruit inutile en production) ;
 * - `warn` / `error` : toujours émis (comportement historique conservé).
 */
export const logger = {
  info(...args: unknown[]): void {
    if (import.meta.env.DEV) console.info(...args);
  },
  warn(...args: unknown[]): void {
    console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
