import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@db/db';
import { ApiError } from '@services/api/apiClient';
import {
  buildOptimisticOrder,
  buildOptimisticPayment,
  enqueueMutation,
  getOwnerKey,
  isRetryableError,
  listOwnerMutations,
  mergePendingClients,
  mergePendingOrders,
  mergePendingPayments,
  runOrQueue,
} from './offlineQueue';
import type { Order } from '@types';

function setSession(userId = 'u1', workshopId = 'ws-1'): void {
  localStorage.setItem('tailor_user', JSON.stringify({ id: userId }));
  localStorage.setItem('tailor_workshop_id', workshopId);
}

const order = (id: string, extra: Partial<Order> = {}): Order => ({
  id,
  workshopId: 'ws-1',
  clientId: 'c1',
  orderNumber: `AW-${id}`,
  modelName: 'Boubou',
  totalAmount: 20000,
  totalPaid: 5000,
  remainingBalance: 15000,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01',
  createdAt: '2026-09-01',
  ...extra,
});

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

describe('offlineQueue', () => {
  beforeEach(async () => {
    await db.pendingMutations.clear();
    setSession();
    setOnline(true);
  });

  afterEach(() => setOnline(true));

  it('clé propriétaire « utilisateur:atelier », vide hors session', () => {
    expect(getOwnerKey()).toBe('u1:ws-1');
    localStorage.clear();
    expect(getOwnerKey()).toBe('');
  });

  it('classe les erreurs à retenter (réseau, délai, 5xx) et non les 4xx', () => {
    expect(isRetryableError(new ApiError('délai', 0))).toBe(true);
    expect(isRetryableError(new ApiError('panne', 503))).toBe(true);
    expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isRetryableError(new ApiError('trop-perçu', 422))).toBe(false);
    expect(isRetryableError(new Error('autre'))).toBe(false);
  });

  it('une double mise en file avec le même clientMutationId ne crée qu’une entrée', async () => {
    const payload = {
      id: 'p1',
      clientMutationId: 'cm-1',
      amount: 5000,
      method: 'CASH' as const,
      channel: 'ORDER_BALANCE' as const,
    };
    await enqueueMutation('RECORD_PAYMENT', payload);
    await enqueueMutation('RECORD_PAYMENT', payload);
    const all = await listOwnerMutations();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: 'RECORD_PAYMENT:cm-1',
      status: 'pending',
      ownerKey: 'u1:ws-1',
    });
  });

  it('la file est cloisonnée par utilisateur/atelier', async () => {
    await enqueueMutation('UPDATE_ORDER_STATUS', { id: 'o1', status: 'LIVRE' });
    setSession('u2', 'ws-9');
    expect(await listOwnerMutations()).toHaveLength(0);
  });

  describe('runOrQueue', () => {
    const payload = { id: 'o9', status: 'TERMINE' as const };

    it('exécute l’appel quand tout va bien', async () => {
      const call = vi.fn().mockResolvedValue('serveur');
      const outcome = await runOrQueue('UPDATE_ORDER_STATUS', payload, call, () => 'optimiste');
      expect(outcome).toEqual({ result: 'serveur', queued: false });
      expect(await listOwnerMutations()).toHaveLength(0);
    });

    it('met en file sans appel réseau quand l’appareil est hors ligne', async () => {
      setOnline(false);
      const call = vi.fn();
      const outcome = await runOrQueue('UPDATE_ORDER_STATUS', payload, call, () => 'optimiste');
      expect(call).not.toHaveBeenCalled();
      expect(outcome).toEqual({ result: 'optimiste', queued: true });
      expect(await listOwnerMutations()).toHaveLength(1);
    });

    it('met en file après une erreur réseau ou 5xx', async () => {
      const call = vi.fn().mockRejectedValue(new ApiError('Erreur serveur (502)', 502));
      const outcome = await runOrQueue('UPDATE_ORDER_STATUS', payload, call, () => 'optimiste');
      expect(outcome.queued).toBe(true);
    });

    it('propage les refus métier (4xx) sans mettre en file', async () => {
      const call = vi.fn().mockRejectedValue(new ApiError('Acompte supérieur au total', 422));
      await expect(
        runOrQueue('UPDATE_ORDER_STATUS', payload, call, () => 'optimiste'),
      ).rejects.toThrow('Acompte supérieur au total');
      expect(await listOwnerMutations()).toHaveLength(0);
    });
  });

  describe('fusion des entités en attente', () => {
    it('ajoute clientes, commandes et encaissements optimistes absents du serveur', async () => {
      await enqueueMutation(
        'CREATE_CLIENT',
        { id: 'c9', fullName: 'Awa', phone: '77', gender: 'F' },
        {
          id: 'c9',
          workshopId: 'ws-1',
          fullName: 'Awa',
          phone: '77',
          gender: 'F',
          measurements: {},
          createdAt: 'x',
          isSynced: false,
        },
      );
      const newOrderDto = {
        id: 'o9',
        clientId: 'c9',
        modelName: 'Robe',
        totalAmount: 10000,
        depositAmount: 2000,
        deliveryDeadline: '2026-10-10',
      };
      await enqueueMutation('CREATE_ORDER', newOrderDto, buildOptimisticOrder(newOrderDto));
      const payDto = {
        id: 'p9',
        clientMutationId: 'cm9',
        orderId: 'o1',
        amount: 5000,
        method: 'WAVE' as const,
        channel: 'ORDER_BALANCE' as const,
      };
      await enqueueMutation('RECORD_PAYMENT', payDto, buildOptimisticPayment(payDto, order('o1')));
      await enqueueMutation('UPDATE_ORDER_STATUS', { id: 'o1', status: 'TERMINE' });

      expect((await mergePendingClients([])).map((c) => c.id)).toEqual(['c9']);
      expect((await mergePendingPayments([])).map((p) => p.id)).toEqual(['p9']);

      const orders = await mergePendingOrders([order('o1')]);
      expect(orders.map((o) => o.id)).toEqual(['o9', 'o1']);
      expect(orders[0]).toMatchObject({ remainingBalance: 8000, isSynced: false });
      expect(orders[1]).toMatchObject({
        status: 'TERMINE',
        totalPaid: 10000,
        remainingBalance: 10000,
      });
    });

    it('n’ajoute pas de doublon si le serveur connaît déjà l’entité', async () => {
      const dto = {
        id: 'o1',
        clientId: 'c1',
        modelName: 'Robe',
        totalAmount: 10000,
        deliveryDeadline: '2026-10-10',
      };
      await enqueueMutation('CREATE_ORDER', dto, buildOptimisticOrder(dto));
      expect(await mergePendingOrders([order('o1')])).toHaveLength(1);
    });
  });
});
