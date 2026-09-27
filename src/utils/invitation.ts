/**
 * Outils du parcours « Rejoindre un atelier » (lien `/join?token=…` produit par
 * `POST /workshops/invite`).
 */
import type { Workshop } from '@types';

/** Message affiché quand le lien est absent, déjà utilisé ou expiré (400 de l'API). */
export const INVALID_INVITATION_MESSAGE = "Lien d'invitation invalide ou expiré.";

/** Longueur minimale d'un jeton plausible (l'API génère 32 octets en hexadécimal). */
const MIN_TOKEN_LENGTH = 8;

/**
 * Jeton d'invitation lu depuis `?token=` (format réel de l'API) ou `/join/:token`.
 *
 * @param search - Paramètres de l'URL courante.
 * @param pathToken - Segment `:token` de la route, s'il existe.
 * @returns Le jeton nettoyé, ou `null` s'il est absent ou manifestement invalide.
 */
export function readInvitationToken(search: URLSearchParams, pathToken?: string): string | null {
  const raw = (search.get('token') ?? pathToken ?? '').trim();
  return raw.length >= MIN_TOKEN_LENGTH ? raw : null;
}

/**
 * Nom de l'atelier extrait du message de confirmation de l'API
 * (« Vous avez rejoint l'Atelier X avec succès »).
 *
 * @param message - Message renvoyé par `POST /workshops/join`.
 * @returns Le nom de l'atelier, ou `null` si le format n'est pas reconnu.
 */
export function extractJoinedWorkshopName(message: string | undefined): string | null {
  const match = /rejoint l'atelier\s+(.+?)\s+avec succès/i.exec(message ?? '');
  return match ? match[1].trim() : null;
}

/**
 * Place l'atelier rejoint en tête de liste (il devient l'atelier actif après la
 * connexion automatique). Retourne une nouvelle liste, sans modifier l'entrée.
 *
 * @param workshops - Ateliers renvoyés par la connexion.
 * @param workshopName - Nom de l'atelier rejoint.
 */
export function prioritizeWorkshop(workshops: Workshop[], workshopName: string | null): Workshop[] {
  if (!workshopName) return workshops;
  const target = workshopName.toLocaleLowerCase('fr');
  const index = workshops.findIndex((ws) => ws.name.toLocaleLowerCase('fr') === target);
  if (index <= 0) return workshops;
  return [workshops[index], ...workshops.filter((_, i) => i !== index)];
}
