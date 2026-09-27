/**
 * Session d'administration, stockée séparément de la session atelier
 * (`tailor_token`...) : se connecter au back-office ne touche jamais à la
 * session d'un atelier ouverte sur le même appareil, et inversement.
 */
import { readStoredJson } from './storage';
import type { AdminUser } from '@types';

export const ADMIN_TOKEN_KEY = 'tailor_admin_token';
export const ADMIN_USER_KEY = 'tailor_admin_user';

/** Jeton d'administration courant, ou `null`. */
export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Administrateur connecté, ou `null` (valeur corrompue comprise). */
export function getAdminUser(): AdminUser | null {
  return readStoredJson<AdminUser | null>(ADMIN_USER_KEY, null);
}

/** Vrai si une session super-administrateur valide est enregistrée. */
export function hasAdminSession(): boolean {
  return Boolean(getAdminToken()) && getAdminUser()?.systemRole === 'SUPER_ADMIN';
}

/** Enregistre la session d'administration. */
export function saveAdminSession(token: string, user: AdminUser): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

/** Supprime la session d'administration (sans toucher à celle de l'atelier). */
export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}
