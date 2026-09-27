import { request } from './apiClient';
import { clearAdminSession, getAdminToken } from '@utils/adminSession';
import type {
  ActivateSubscriptionDto,
  AdminLoginResponse,
  AdminSubscriptionPayment,
  AdminWorkshop,
  CursorPage,
  SubscriptionPaymentStatus,
} from '@types';

/** Message unique affiché pour tout échec de connexion (l'API renvoie 401 générique). */
export const ADMIN_LOGIN_ERROR_MESSAGE = 'E-mail ou mot de passe incorrect.';

/** Redirection vers la connexion admin quand la session d'administration expire. */
function handleAdminUnauthorized(): void {
  clearAdminSession();
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin/login';
  }
}

/** Appel authentifié avec le jeton d'administration (jamais celui de l'atelier). */
function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  return request<T>(
    endpoint,
    {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    },
    { onUnauthorized: handleAdminUnauthorized },
  );
}

/** Normalise une liste renvoyée en tableau ou en page `{ data, nextCursor }`. */
export function unwrapList<T>(payload: T[] | CursorPage<T>): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

/** Appels du back-office (super-administrateur). */
export const adminService = {
  /** `POST /auth/admin/login` : connexion par e-mail et mot de passe. */
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    return request<AdminLoginResponse>(
      '/auth/admin/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      { onUnauthorized: () => undefined },
    );
  },

  /** `GET /super-admin/subscription-payments?status=` */
  async listSubscriptionPayments(status?: SubscriptionPaymentStatus): Promise<AdminSubscriptionPayment[]> {
    const query = status ? `?status=${status}` : '';
    return unwrapList(
      await adminRequest<AdminSubscriptionPayment[] | CursorPage<AdminSubscriptionPayment>>(
        `/super-admin/subscription-payments${query}`,
      ),
    );
  },

  /** `POST /super-admin/subscription-payments/:id/confirm` */
  async confirmSubscriptionPayment(id: string, transactionRef?: string): Promise<unknown> {
    return adminRequest(`/super-admin/subscription-payments/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(transactionRef ? { transactionRef } : {}),
    });
  },

  /** `POST /super-admin/subscription-payments/:id/reject` (motif de 3 à 500 caractères). */
  async rejectSubscriptionPayment(id: string, reason: string): Promise<unknown> {
    return adminRequest(`/super-admin/subscription-payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /** `GET /super-admin/workshops` */
  async listWorkshops(): Promise<AdminWorkshop[]> {
    return unwrapList(await adminRequest<AdminWorkshop[] | CursorPage<AdminWorkshop>>('/super-admin/workshops'));
  },

  /** `POST /super-admin/activate-subscription` : activation manuelle. */
  async activateSubscription(dto: ActivateSubscriptionDto): Promise<{ message: string }> {
    return adminRequest<{ message: string }>('/super-admin/activate-subscription', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
