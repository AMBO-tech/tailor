import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@db/db';
import { getOwnerKey, listOwnerMutations } from '@services/offlineQueue';
import { onSyncComplete, syncPendingMutations } from '@services/sync';
import type { PendingMutation } from '@types';

/** Abonnement aux événements réseau du navigateur. */
function subscribeToNetwork(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** `true` si le navigateur se déclare en ligne. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeToNetwork,
    () => navigator.onLine,
    () => true,
  );
}

export interface OfflineStatus {
  isOnline: boolean;
  /** Mutations en attente de synchronisation (hors « à vérifier »). */
  pendingCount: number;
  /** Mutations refusées par le serveur, à vérifier par l'utilisateur. */
  failedMutations: PendingMutation[];
  /** Relance immédiatement une mutation « à vérifier ». */
  retryMutation: (id: string) => Promise<void>;
  /** Abandonne définitivement une mutation « à vérifier ». */
  discardMutation: (id: string) => Promise<void>;
}

/**
 * État de la file hors ligne du propriétaire courant (utilisateur + atelier),
 * lu en direct depuis Dexie : indicateur « Hors ligne · N en attente » et
 * liste des éléments en échec des Réglages.
 */
export function useOfflineStatus(): OfflineStatus {
  const isOnline = useIsOnline();
  const ownerKey = getOwnerKey();
  const mutations = useLiveQuery(() => listOwnerMutations(ownerKey), [ownerKey], []);

  const retryMutation = useCallback(async (id: string) => {
    await db.pendingMutations.update(id, {
      status: 'pending',
      retryCount: 0,
      nextAttemptAt: undefined,
    });
    await syncPendingMutations();
  }, []);

  const discardMutation = useCallback(async (id: string) => {
    await db.pendingMutations.delete(id);
  }, []);

  return {
    isOnline,
    pendingCount: mutations.filter((m) => m.status !== 'needs_review').length,
    failedMutations: mutations.filter((m) => m.status === 'needs_review'),
    retryMutation,
    discardMutation,
  };
}

/**
 * Après chaque synchronisation, recharge les données serveur : les entités
 * optimistes sont remplacées par leurs versions définitives (numéros de
 * commande, de reçu...). À monter une seule fois (AppLayout).
 */
export function useSyncCacheInvalidation(): void {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      onSyncComplete(() => {
        void queryClient.invalidateQueries();
      }),
    [queryClient],
  );
}
