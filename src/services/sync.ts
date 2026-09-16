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

    // Topological sorting: Clients first, then Orders, then Payments, then Status Updates
    const orderPriority: Record<string, number> = {
      CREATE_CLIENT: 1,
      CREATE_ORDER: 2,
      RECORD_PAYMENT: 3,
      UPDATE_ORDER_STATUS: 4,
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
          const localClient = await db.clients.get(mutation.payload.id);
          await db.clients.put({
            ...(localClient || {}),
            ...remote,
            id: remote.id || mutation.payload.id,
            isSynced: true,
          });
        } else if (mutation.type === 'CREATE_ORDER') {
          const remote = await api.createOrder(mutation.payload);
          const localOrder = await db.orders.get(mutation.payload.id);
          const totalAmt = Number(remote.totalAmount) || Number(mutation.payload.totalAmount) || 0;
          const depositAmt = Number(mutation.payload.depositAmount) || (localOrder?.totalPaid ? Number(localOrder.totalPaid) : 0);
          const remBal = remote.remainingBalance !== undefined ? Number(remote.remainingBalance) : Math.max(0, totalAmt - depositAmt);

          await db.orders.put({
            ...(localOrder || {}),
            ...remote,
            id: remote.id || mutation.payload.id,
            totalAmount: totalAmt,
            totalPaid: depositAmt,
            remainingBalance: remBal,
            orderNumber: remote.orderNumber || localOrder?.orderNumber,
            client: remote.client || localOrder?.client,
            isSynced: true,
          });
        } else if (mutation.type === 'RECORD_PAYMENT') {
          const remote = await api.recordPayment(mutation.payload);
          const localPay = await db.payments.get(mutation.payload.id);
          await db.payments.put({
            ...(localPay || {}),
            ...remote,
            id: remote.id || mutation.payload.id,
            amount: Number(remote.amount) || Number(mutation.payload.amount) || 0,
            receiptNumber: remote.receiptNumber || localPay?.receiptNumber,
            isSynced: true,
          });

          if (mutation.payload.orderId) {
            const ord = await db.orders.get(mutation.payload.orderId);
            if (ord) {
              const currentPaid = Number(ord.totalPaid) || 0;
              const payAmt = Number(mutation.payload.amount) || 0;
              const totalAmt = Number(ord.totalAmount) || 0;
              const newPaid = currentPaid + payAmt;
              await db.orders.update(mutation.payload.orderId, {
                totalPaid: newPaid,
                remainingBalance: Math.max(0, totalAmt - newPaid),
              });
            }
          }
        } else if (mutation.type === 'UPDATE_ORDER_STATUS') {
          await api.updateOrderStatus(mutation.payload.id, mutation.payload.status);
          await db.orders.update(mutation.payload.id, {
            status: mutation.payload.status,
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
