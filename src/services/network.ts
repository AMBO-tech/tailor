/**
 * Service de monitoring réseau et mesure de latence
 */
export async function measureNetworkLatency(apiUrl: string = 'http://localhost:4000'): Promise<number | null> {
  if (!navigator.onLine) return null;
  const start = performance.now();
  try {
    const res = await fetch(`${apiUrl}/clients`, {
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' },
    });
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}
