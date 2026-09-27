import { db } from '@db/db';
import { api } from '@services/api';
import { getErrorMessage } from '@utils/errors';
import { logger } from '@utils/logger';
import { getOwnerKey, isRetryableError, listOwnerMutations } from '@services/offlineQueue';
import type { PendingMutation } from '@types';

/** Ordre de rejeu : une cliente avant ses commandes, une commande avant ses paiements. */
const TYPE_PRIORITY: Record<PendingMutation['type'], number> = {
  CREATE_CLIENT: 1,
  CREATE_ORDER: 2,
  RECORD_PAYMENT: 3,
  UPDATE_ORDER_STATUS: 4,
  CREATE_SUBSCRIPTION_PAYMENT: 5,
};

/** Premier délai de report après un échec réseau / 5xx (5 s), doublé à chaque essai. */
export const BASE_RETRY_DELAY_MS = 5_000;
/** Plafond du report exponentiel (1 h). */
export const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
/** Période de la synchronisation de fond tant qu'il reste des mutations. */
export const BACKGROUND_SYNC_INTERVAL_MS = 30_000;
/** Nom du verrou partagé entre onglets (Web Locks API). */
const SYNC_LOCK_NAME = 'sama-waay-sync';

export interface SyncResult {
  successCount: number;
  failureCount: number;
}

type SyncListener = (result: SyncResult) => void;
const listeners = new Set<SyncListener>();

/** S'abonne à la fin de chaque synchronisation ayant traité au moins une mutation. */
export function onSyncComplete(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Délai avant la prochaine tentative après `retryCount` échecs. */
export function computeRetryDelay(retryCount: number): number {
  return Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** Math.max(0, retryCount - 1));
}

/** Trie par dépendance (type) puis par date de création. */
export function sortForReplay(mutations: PendingMutation[]): PendingMutation[] {
  return [...mutations].sort(
    (a, b) =>
      TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] || a.createdAt.localeCompare(b.createdAt),
  );
}

/** Identifiants dont dépend une mutation (cliente d'une commande, commande d'un paiement...). */
function dependenciesOf(mutation: PendingMutation): string[] {
  switch (mutation.type) {
    case 'CREATE_ORDER':
      return [mutation.payload.clientId];
    case 'RECORD_PAYMENT':
      return mutation.payload.orderId ? [mutation.payload.orderId] : [];
    case 'UPDATE_ORDER_STATUS':
      return [mutation.payload.id];
    default:
      return [];
  }
}

/** Envoie une mutation au serveur et met à jour le cache local Dexie. */
async function replay(mutation: PendingMutation): Promise<void> {
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
    const depositAmt =
      Number(mutation.payload.depositAmount) ||
      (localOrder?.totalPaid ? Number(localOrder.totalPaid) : 0);
    const remBal =
      remote.remainingBalance !== undefined
        ? Number(remote.remainingBalance)
        : Math.max(0, totalAmt - depositAmt);

    await db.orders.put({
      ...(localOrder || {}),
      ...remote,
      id: remote.id || mutation.payload.id,
      totalAmount: totalAmt,
      totalPaid: depositAmt,
      remainingBalance: remBal,
      orderNumber: remote.orderNumber || localOrder?.orderNumber || '',
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
      receiptNumber: remote.receiptNumber || localPay?.receiptNumber || '',
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
  } else if (mutation.type === 'CREATE_SUBSCRIPTION_PAYMENT') {
    // Idempotent côté serveur (clientMutationId) : un rejeu ne crée pas de doublon.
    await api.createManualPayment(mutation.payload);
  } else if (mutation.type === 'UPDATE_ORDER_STATUS') {
    await api.updateOrderStatus(mutation.payload.id, mutation.payload.status);
    await db.orders.update(mutation.payload.id, {
      status: mutation.payload.status,
      isSynced: true,
    });
  }
}

let runningSync: Promise<SyncResult> | null = null;

/** Rejoue la file du propriétaire courant (sans verrou). */
async function processQueue(): Promise<SyncResult> {
  let successCount = 0;
  let failureCount = 0;
  const now = Date.now();
  const mutations = sortForReplay(await listOwnerMutations(getOwnerKey()));
  /** Identifiants dont la création n'a pas (encore) abouti : leurs dépendants attendent. */
  const blockedIds = new Set<string>();

  for (const mutation of mutations) {
    const entityId = mutation.payload.id;
    const isBlocked = dependenciesOf(mutation).some((dep) => blockedIds.has(dep));
    const isWaiting =
      mutation.status === 'needs_review' ||
      (mutation.nextAttemptAt !== undefined && mutation.nextAttemptAt > now);

    if (isBlocked || isWaiting) {
      if (mutation.type !== 'UPDATE_ORDER_STATUS') blockedIds.add(entityId);
      continue;
    }

    try {
      await replay(mutation);
      await db.pendingMutations.delete(mutation.id);
      successCount++;
    } catch (err: unknown) {
      failureCount++;
      const message = getErrorMessage(err, String(err));
      if (mutation.type !== 'UPDATE_ORDER_STATUS') blockedIds.add(entityId);
      logger.error(`Erreur sync mutation (${mutation.type}):`, message);

      if (isRetryableError(err)) {
        const retryCount = (mutation.retryCount || 0) + 1;
        await db.pendingMutations.update(mutation.id, {
          retryCount,
          lastError: message,
          nextAttemptAt: Date.now() + computeRetryDelay(retryCount),
        });
        // Réseau coupé : inutile d'insister sur les suivantes pendant ce passage.
        break;
      }

      // Refus métier (4xx) : conservé et signalé « à vérifier », jamais ignoré.
      await db.pendingMutations.update(mutation.id, {
        status: 'needs_review',
        lastError: message,
      });
    }
  }

  return { successCount, failureCount };
}

/**
 * Synchronise les mutations en attente du propriétaire courant.
 *
 * - aucune double synchronisation : un appel pendant une synchronisation en
 *   cours renvoie la même promesse, et un verrou Web Locks évite que deux
 *   onglets rejouent la même file ;
 * - ordre : cliente → commande → encaissement → statut, puis date de création ;
 * - une mutation dont la dépendance n'a pas abouti attend le passage suivant ;
 * - erreur réseau / 5xx : report exponentiel ; erreur 4xx : « à vérifier ».
 */
export function syncPendingMutations(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return Promise.resolve({ successCount: 0, failureCount: 0 });
  }
  if (runningSync) return runningSync;

  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  const run: Promise<SyncResult> = locks
    ? locks.request(
        SYNC_LOCK_NAME,
        { ifAvailable: true },
        async (lock): Promise<SyncResult> =>
          lock ? processQueue() : { successCount: 0, failureCount: 0 },
        // Le rappel renvoie une promesse : on l'aplatit explicitement.
      ).then<SyncResult>((result) => result)
    : processQueue();

  runningSync = run
    .then((result) => {
      if (result.successCount > 0 || result.failureCount > 0) {
        listeners.forEach((listener) => listener(result));
      }
      return result;
    })
    .finally(() => {
      runningSync = null;
    });
  return runningSync;
}

let stopBackgroundSync: (() => void) | null = null;

/**
 * Démarre la synchronisation de fond (appelé une fois au démarrage, main.tsx) :
 * au retour du réseau, périodiquement, et immédiatement au lancement.
 *
 * @returns Fonction d'arrêt (utile aux tests).
 */
export function startBackgroundSync(intervalMs = BACKGROUND_SYNC_INTERVAL_MS): () => void {
  if (stopBackgroundSync) return stopBackgroundSync;
  const trigger = () => {
    syncPendingMutations().catch((err: unknown) =>
      logger.error('Synchronisation impossible :', err),
    );
  };

  window.addEventListener('online', trigger);
  const intervalId = window.setInterval(trigger, intervalMs);
  trigger();

  stopBackgroundSync = () => {
    window.removeEventListener('online', trigger);
    window.clearInterval(intervalId);
    stopBackgroundSync = null;
  };
  return stopBackgroundSync;
}
