import { db } from '../db/db';
import { api } from './api';

export async function syncPendingMutations() {
  if (!navigator.onLine) return;

  const mutations = await db.pendingMutations.toArray();
  if (mutations.length === 0) return;

  for (const mutation of mutations) {
    try {
      if (mutation.type === 'CREATE_CLIENT') {
        const remote = await api.createClient(mutation.payload);
        await db.clients.update(mutation.payload.id, { ...remote, isSynced: true });
      } else if (mutation.type === 'CREATE_ORDER') {
        const remote = await api.createOrder(mutation.payload);
        await db.orders.update(mutation.payload.id, {
          ...remote,
          orderNumber: remote.orderNumber,
          isSynced: true,
        });
      } else if (mutation.type === 'RECORD_PAYMENT') {
        const remote = await api.recordPayment(mutation.payload);
        await db.payments.update(mutation.payload.id, {
          receiptNumber: remote.receiptNumber,
          isSynced: true,
        });
      }
      await db.pendingMutations.delete(mutation.id);
    } catch (err: any) {
      console.error(`Erreur sync mutation:`, err.message);
      await db.pendingMutations.update(mutation.id, {
        retryCount: (mutation.retryCount || 0) + 1,
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingMutations();
  });
}
