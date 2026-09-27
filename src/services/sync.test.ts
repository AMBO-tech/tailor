import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@db/db';
import { api } from '@services/api';
import { ApiError } from '@services/api/apiClient';
import { enqueueMutation, listOwnerMutations } from './offlineQueue';
import {
  computeRetryDelay,
  onSyncComplete,
  sortForReplay,
  startBackgroundSync,
  syncPendingMutations,
  MAX_RETRY_DELAY_MS,
} from './sync';
import type { Client, Order, PaymentEntry } from '@types';

function setSession(userId = 'u1', workshopId = 'ws-1') {
  localStorage.setItem('tailor_user', JSON.stringify({ id: userId }));
  localStorage.setItem('tailor_workshop_id', workshopId);
}

const clientDto = { id: 'c1', fullName: 'Awa', phone: '771234567', gender: 'F' as const };
const orderDto = { id: 'o1', clientMutationId: 'cm-o1', clientId: 'c1', modelName: 'Robe', totalAmount: 10000, deliveryDeadline: '2026-10-10' };
const paymentDto = { id: 'p1', clientMutationId: 'cm-p1', orderId: 'o1', amount: 5000, method: 'CASH' as const, channel: 'ORDER_BALANCE' as const };

describe('sync', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.pendingMutations.clear();
    setSession();
    vi.spyOn(api, 'createClient').mockResolvedValue({ id: 'c1' } as Client);
    vi.spyOn(api, 'createOrder').mockResolvedValue({ id: 'o1', totalAmount: 10000, orderNumber: 'AW-1' } as Order);
    vi.spyOn(api, 'recordPayment').mockResolvedValue({ id: 'p1', amount: 5000, receiptNumber: 'R1' } as PaymentEntry);
    vi.spyOn(api, 'updateOrderStatus').mockResolvedValue({ id: 'o1' } as Order);
  });

  afterEach(() => vi.useRealTimers());

  it('rejoue dans l’ordre cliente → commande → encaissement → statut puis vide la file', async () => {
    // Mise en file dans le désordre.
    await enqueueMutation('UPDATE_ORDER_STATUS', { id: 'o1', status: 'TERMINE' });
    await enqueueMutation('RECORD_PAYMENT', paymentDto);
    await enqueueMutation('CREATE_ORDER', orderDto);
    await enqueueMutation('CREATE_CLIENT', clientDto);
    const calls: string[] = [];
    for (const name of ['createClient', 'createOrder', 'recordPayment', 'updateOrderStatus'] as const) {
      vi.mocked(api[name]).mockImplementation((async () => {
        calls.push(name);
        return { id: 'x', amount: 0, totalAmount: 0 };
      }) as never);
    }

    const result = await syncPendingMutations();

    expect(calls).toEqual(['createClient', 'createOrder', 'recordPayment', 'updateOrderStatus']);
    expect(result).toEqual({ successCount: 4, failureCount: 0 });
    expect(await listOwnerMutations()).toHaveLength(0);
  });

  it('trie par date de création à type égal', () => {
    const base = { retryCount: 0, type: 'UPDATE_ORDER_STATUS' as const };
    const sorted = sortForReplay([
      { ...base, id: 'b', createdAt: '2026-01-02', payload: { id: 'o', status: 'LIVRE' as const } },
      { ...base, id: 'a', createdAt: '2026-01-01', payload: { id: 'o', status: 'TERMINE' as const } },
    ]);
    expect(sorted.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('erreur 4xx : marquée « à vérifier » (jamais ignorée) et bloque ses dépendants', async () => {
    await enqueueMutation('CREATE_ORDER', orderDto);
    await enqueueMutation('RECORD_PAYMENT', paymentDto);
    vi.mocked(api.createOrder).mockRejectedValue(new ApiError('Acompte supérieur au total', 422));

    const result = await syncPendingMutations();

    expect(result.failureCount).toBe(1);
    expect(api.recordPayment).not.toHaveBeenCalled();
    const [orderM, payM] = await listOwnerMutations();
    expect(orderM).toMatchObject({ status: 'needs_review', lastError: 'Acompte supérieur au total' });
    expect(payM.status).toBe('pending');

    // Passage suivant : la commande à vérifier n'est pas renvoyée automatiquement.
    await syncPendingMutations();
    expect(api.createOrder).toHaveBeenCalledTimes(1);
  });

  it('erreur réseau : report exponentiel et arrêt du passage', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-25T09:00:00Z'), toFake: ['Date'] });
    await enqueueMutation('CREATE_CLIENT', clientDto);
    await enqueueMutation('UPDATE_ORDER_STATUS', { id: 'o5', status: 'LIVRE' });
    vi.mocked(api.createClient).mockRejectedValue(new ApiError("Délai d'attente réseau dépassé", 0));

    await syncPendingMutations();

    expect(api.updateOrderStatus).not.toHaveBeenCalled();
    const [clientM] = await listOwnerMutations();
    expect(clientM.retryCount).toBe(1);
    expect(clientM.nextAttemptAt).toBe(Date.now() + computeRetryDelay(1));

    // Avant l'échéance : aucune nouvelle tentative.
    await syncPendingMutations();
    expect(api.createClient).toHaveBeenCalledTimes(1);
  });

  it('délai de report doublé à chaque essai et plafonné', () => {
    expect(computeRetryDelay(1)).toBe(5_000);
    expect(computeRetryDelay(2)).toBe(10_000);
    expect(computeRetryDelay(30)).toBe(MAX_RETRY_DELAY_MS);
  });

  it('pas de double synchronisation : deux appels simultanés partagent la même promesse', async () => {
    await enqueueMutation('CREATE_CLIENT', clientDto);
    const [a, b] = [syncPendingMutations(), syncPendingMutations()];
    expect(a).toBe(b);
    await a;
    expect(api.createClient).toHaveBeenCalledTimes(1);
  });

  it('ne rejoue pas les mutations d’un autre utilisateur/atelier', async () => {
    await enqueueMutation('CREATE_CLIENT', clientDto);
    setSession('u2', 'ws-2');
    await syncPendingMutations();
    expect(api.createClient).not.toHaveBeenCalled();
  });

  it('prévient les abonnés après une synchronisation', async () => {
    const listener = vi.fn();
    const unsubscribe = onSyncComplete(listener);
    await enqueueMutation('CREATE_CLIENT', clientDto);
    await syncPendingMutations();
    unsubscribe();
    expect(listener).toHaveBeenCalledWith({ successCount: 1, failureCount: 0 });
  });

  it('startBackgroundSync synchronise au démarrage et au retour du réseau', async () => {
    await enqueueMutation('CREATE_CLIENT', clientDto);
    const stop = startBackgroundSync(60_000);
    await vi.waitFor(() => expect(api.createClient).toHaveBeenCalledTimes(1));

    await enqueueMutation('CREATE_CLIENT', { ...clientDto, id: 'c2' });
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(api.createClient).toHaveBeenCalledTimes(2));
    stop();
  });
});
