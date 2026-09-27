/**
 * Extrait un message lisible d'une erreur de type inconnu (bloc `catch`,
 * callback `onError`...).
 *
 * Reproduit le comportement historique `err.message || repli` sans recourir
 * à `any` : renvoie `message` s'il s'agit d'une chaîne non vide, sinon le
 * message de repli fourni.
 *
 * @param err - Valeur capturée (Error, objet quelconque, chaîne...).
 * @param fallback - Message affiché quand aucune information exploitable n'existe.
 * @returns Le message d'erreur à présenter à l'utilisateur.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const { message } = err as { message: unknown };
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

/**
 * Indique si l'erreur provient de l'annulation d'une requête
 * (`AbortController.abort()`), quel que soit son type concret
 * (`DOMException` dans les navigateurs, `Error` ailleurs).
 *
 * @param err - Valeur capturée.
 * @returns `true` si `err.name === 'AbortError'`.
 */
export function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}

/** Erreurs déjà signalées à l'utilisateur (toast), sans modifier l'objet erreur. */
const notifiedErrors = new WeakSet<object>();

/**
 * Marque une erreur comme déjà affichée (ex. par le `onError` d'une mutation),
 * pour que l'appelant n'affiche pas une seconde fois le même message.
 */
export function markErrorNotified(err: unknown): void {
  if (typeof err === 'object' && err !== null) notifiedErrors.add(err);
}

/** Vrai si l'erreur a déjà été signalée à l'utilisateur. */
export function wasErrorNotified(err: unknown): boolean {
  return typeof err === 'object' && err !== null && notifiedErrors.has(err);
}
