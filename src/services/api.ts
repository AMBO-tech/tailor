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

export const api = {
  async register(data: any) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur inscription');
    }
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Identifiants incorrects');
    }
    return res.json();
  },

  async getDashboard() {
    const res = await fetch(`${API_URL}/orders/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur chargement dashboard');
    return res.json();
  },

  async createClient(data: any) {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur création client');
    }
    return res.json();
  },

  async listClients(q?: string) {
    const url = q ? `${API_URL}/clients?q=${encodeURIComponent(q)}` : `${API_URL}/clients`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur récupération clients');
    return res.json();
  },

  async createOrder(data: any) {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur création commande');
    }
    return res.json();
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur mise à jour statut');
    }
    return res.json();
  },

  async listOrders(status?: string) {
    const url = status ? `${API_URL}/orders?status=${status}` : `${API_URL}/orders`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur récupération commandes');
    return res.json();
  },

  async recordPayment(data: any) {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur enregistrement versement');
    }
    return res.json();
  },

  async listPayments() {
    const res = await fetch(`${API_URL}/payments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur récupération paiements');
    return res.json();
  },

  async inviteEmployee(data: any) {
    const res = await fetch(`${API_URL}/workshops/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur invitation');
    }
    return res.json();
  },

  async revokeEmployee(employeeId: string) {
    const res = await fetch(`${API_URL}/workshops/members/${employeeId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur révocation employé');
    }
    return res.json();
  },

  async listMembers() {
    const res = await fetch(`${API_URL}/workshops/members`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur récupération membres');
    return res.json();
  },
};
