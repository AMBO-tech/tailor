import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, getAuthHeaders, handleUnauthorizedOrRevoked, request } from './apiClient';

/** Construit une réponse `fetch` minimale. */
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('getAuthHeaders', () => {
  it('n’ajoute que Content-Type sans session', () => {
    expect(getAuthHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  it('ajoute le jeton et l’atelier courant', () => {
    localStorage.setItem('tailor_token', 'jwt');
    localStorage.setItem('tailor_workshop_id', 'ws-1');
    expect(getAuthHeaders()).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt',
      'x-workshop-id': 'ws-1',
    });
  });
});

describe('handleUnauthorizedOrRevoked', () => {
  it('efface la session locale', () => {
    localStorage.setItem('tailor_token', 'jwt');
    localStorage.setItem('tailor_user', '{}');
    localStorage.setItem('tailor_workshop_id', 'ws-1');
    handleUnauthorizedOrRevoked();
    expect(localStorage.getItem('tailor_token')).toBeNull();
    expect(localStorage.getItem('tailor_user')).toBeNull();
    expect(localStorage.getItem('tailor_workshop_id')).toBeNull();
  });
});

describe('request', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('préfixe l’URL de base, fusionne les en-têtes et renvoie le JSON', async () => {
    localStorage.setItem('tailor_token', 'jwt');
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ id: 'c1' }]));

    const data = await request<{ id: string }[]>('/clients', { headers: { 'X-Test': '1' } });

    expect(data).toEqual([{ id: 'c1' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/clients`);
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer jwt', 'X-Test': '1' });
  });

  it('laisse les URL absolues inchangées', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
    await request('https://exemple.test/ping');
    expect(fetchMock.mock.calls[0][0]).toBe('https://exemple.test/ping');
  });

  it('propage le message d’erreur du serveur', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { message: 'Téléphone invalide' }));
    await expect(request('/clients')).rejects.toThrow('Téléphone invalide');
  });

  it('utilise un message générique si le corps n’est pas du JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    await expect(request('/clients')).rejects.toThrow('Erreur serveur (500)');
  });

  it('sur 401 « révoqué », purge la session puis lève l’erreur', async () => {
    localStorage.setItem('tailor_token', 'jwt');
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Accès révoqué' }));
    await expect(request('/orders')).rejects.toThrow('Accès révoqué');
    expect(localStorage.getItem('tailor_token')).toBeNull();
  });

  it('sur 401 simple, conserve la session', async () => {
    localStorage.setItem('tailor_token', 'jwt');
    fetchMock.mockResolvedValueOnce(jsonResponse(401, {}));
    await expect(request('/orders')).rejects.toThrow('Session expirée ou accès non autorisé');
    expect(localStorage.getItem('tailor_token')).toBe('jwt');
  });

  it('traduit l’expiration du délai (10 s) en message lisible', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const pending = request('/orders');
    const assertion = expect(pending).rejects.toThrow("Délai d'attente réseau dépassé");
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });
});
