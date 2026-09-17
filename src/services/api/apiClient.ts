export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('tailor_token');
  const workshopId = localStorage.getItem('tailor_workshop_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(workshopId ? { 'x-workshop-id': workshopId } : {}),
  };
}

export function handleUnauthorizedOrRevoked(): void {
  localStorage.removeItem('tailor_token');
  localStorage.removeItem('tailor_user');
  localStorage.removeItem('tailor_workshops');
  localStorage.removeItem('tailor_workshop');
  localStorage.removeItem('tailor_workshop_id');
  window.location.href = '/login';
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

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
      if (
        errData.message?.includes('révoqué') ||
        errData.message?.includes('introuvable') ||
        errData.message?.includes('expiré')
      ) {
        handleUnauthorizedOrRevoked();
      }
      throw new Error(errData.message || 'Session expirée ou accès non autorisé');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erreur serveur (${res.status})`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("Délai d'attente réseau dépassé (connexion instable)");
    }
    throw err;
  }
}
