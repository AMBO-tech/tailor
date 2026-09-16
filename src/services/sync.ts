import { db } from '@db/db';
import { api } from '@services/api';

let isSyncRunning = false;

export async function syncPendingMutations(): Promise<{
  successCount: number;
  failureCount: number;
}> {
  if (!navigator.onLine || isSyncRunning) {
    return { successCount: 0, failureCount: 0 };
  }

  isSyncRunning = true;
  let successCount = 0;
  let failureCount = 0;

  try {
    const mutations = await db.pendingMutations.toArray();
    if (mutations.length === 0) return { successCount: 0, failureCount: 0 };

    // Topological sorting: Clients first, then Orders, then Payments
    const orderPriority: Record<string, number> = {
      CREATE_CLIENT: 1,
      CREATE_ORDER: 2,
      RECORD_PAYMENT: 3,
    };

    mutations.sort(
      (a, b) => (orderPriority[a.type] || 99) - (orderPriority[b.type] || 99),
    );

    for (const mutation of mutations) {
      // If mutation failed more than 5 times with permanent client error, skip to avoid head-of-line blocking
      if (mutation.retryCount >= 5) {
        failureCount++;
        continue;
      }

      try {
        if (mutation.type === 'CREATE_CLIENT') {
          const remote = await api.createClient(mutation.payload);
          await db.clients.update(mutation.payload.id, {
            ...remote,
            isSynced: true,
          });
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
        successCount++;
      } catch (err: any) {
        failureCount++;
        console.error(`Erreur sync mutation (${mutation.type}):`, err.message);
        await db.pendingMutations.update(mutation.id, {
          retryCount: (mutation.retryCount || 0) + 1,
        });
      }
    }
  } finally {
    isSyncRunning = false;
  }

  return { successCount, failureCount };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingMutations();
  });
}
