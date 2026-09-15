import { db } from '../db/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getAuthHeaders() {
  const token = localStorage.getItem('tailor_token');
  const workshopId = localStorage.getItem('tailor_workshop_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(workshopId ? { 'x-workshop-id': workshopId } : {}),
  };
}

export async function handleUnauthorizedOrRevoked() {
  console.warn('🚨 Détection de révocation : Purge de sécurité du cache local IndexedDB...');
  try {
    await db.clients.clear();
    await db.orders.clear();
    await db.payments.clear();
    await db.pendingMutations.clear();
  } catch (e) {
    console.error('Erreur purge local cache:', e);
  }
  localStorage.removeItem('tailor_token');
  localStorage.removeItem('tailor_user');
  localStorage.removeItem('tailor_workshops');
  localStorage.removeItem('tailor_workshop');
  localStorage.removeItem('tailor_workshop_id');
  window.location.reload();
}

async function request(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

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
      if (errData.message?.includes('révoqué') || errData.message?.includes('introuvable')) {
        await handleUnauthorizedOrRevoked();
      }
      throw new Error(errData.message || 'Session expirée ou accès révoqué');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erreur serveur (${res.status})`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Délai d\'attente réseau dépassé (connexion instable)');
    }
    throw err;
  }
}

export const api = {
  async register(data: any) {
    return request(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: any) {
    return request(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDashboard() {
    return request(`${API_URL}/orders/dashboard`);
  },

  async createClient(data: any) {
    return request(`${API_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listClients(q?: string) {
    const url = q ? `${API_URL}/clients?q=${encodeURIComponent(q)}` : `${API_URL}/clients`;
    return request(url);
  },

  async createOrder(data: any) {
    return request(`${API_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: string) {
    return request(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async listOrders(status?: string) {
    const url = status ? `${API_URL}/orders?status=${status}` : `${API_URL}/orders`;
    return request(url);
  },

  async recordPayment(data: any) {
    return request(`${API_URL}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listPayments() {
    return request(`${API_URL}/payments`);
  },

  async inviteEmployee(data: any) {
    return request(`${API_URL}/workshops/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeEmployee(employeeId: string) {
    return request(`${API_URL}/workshops/members/${employeeId}/revoke`, {
      method: 'POST',
    });
  },

  async listMembers() {
    return request(`${API_URL}/workshops/members`);
  },
};
