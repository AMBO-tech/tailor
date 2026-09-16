/**
 * Service de monitoring réseau et mesure de connectivité réelle (Active Heartbeat)
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function checkServerHealth(): Promise<boolean> {
  if (!navigator.onLine) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function measureNetworkLatency(): Promise<number | null> {
  if (!navigator.onLine) return null;
  const start = performance.now();
  try {
    const isUp = await checkServerHealth();
    if (!isUp) return null;
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}
