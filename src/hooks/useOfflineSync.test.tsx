import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { db } from '@db/db';
import { orderService } from '@services/api/order.service';
import { paymentService } from '@services/api/payment.service';
import { clientService } from '@services/api/client.service';
import { enqueueMutation } from '@services/offlineQueue';
import { toast } from '@services/toast';
import { createTestQueryClient } from '../testUtils';
import {
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  ORDER_QUERY_KEYS,
} from './useOrders';
import { useRecordPaymentMutation } from './usePayments';
import { useCreateClientMutation } from './useClients';
import { useOfflineStatus } from './useOfflineSync';
import { buildSyncLabel } from '@components/layout/Header';
import { PendingSyncCard } from '@components/settings/PendingSyncCard';
import type { Order } from '@types';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

const cachedOrder: Order = {
  id: 'o1',
  workshopId: 'ws-1',
  clientId: 'c1',
  orderNumber: 'AW-1',
  modelName: 'Boubou',
  totalAmount: 20000,
  totalPaid: 5000,
  remainingBalance: 15000,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01',
  createdAt: '2026-09-01',
  client: { id: 'c1', fullName: 'Awa Ndiaye', phone: '771234567' },
};

function setup() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(ORDER_QUERY_KEYS.list(), [cachedOrder]);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('mode hors ligne branché sur les mutations', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.pendingMutations.clear();
    localStorage.setItem('tailor_user', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('tailor_workshop_id', 'ws-1');
    setOnline(false);
  });

  afterEach(() => setOnline(true));

  it('encaissement hors ligne : mis en file, reliquat mis à jour de façon optimiste', async () => {
    const recordPayment = vi.spyOn(paymentService, 'recordPayment');
    const info = vi.spyOn(toast, 'info');
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useRecordPaymentMutation(), { wrapper });

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        clientMutationId: 'cm-1',
        orderId: 'o1',
        amount: 5000,
        method: 'CASH',
        channel: 'ORDER_BALANCE',
      });
    });

    expect(recordPayment).not.toHaveBeenCalled();
    expect(response).toMatchObject({ amount: 5000, isSynced: false, receiptNumber: '' });
    expect(await db.pendingMutations.count()).toBe(1);
    expect(queryClient.getQueryData<Order[]>(ORDER_QUERY_KEYS.list())?.[0]).toMatchObject({
      totalPaid: 10000,
      remainingBalance: 10000,
    });
    expect(info).toHaveBeenCalled();
  });

  it('commande hors ligne : affichée en tête de liste avec la cliente connue', async () => {
    vi.spyOn(orderService, 'createOrder');
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(
      ['clients', 'ws-1', {}],
      [{ id: 'c1', fullName: 'Awa Ndiaye', phone: '77' }],
    );
    const { result } = renderHook(() => useCreateOrderMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        clientId: 'c1',
        clientMutationId: 'cm-o',
        modelName: 'Robe',
        totalAmount: 10000,
        deliveryDeadline: '2026-10-10',
      });
    });

    const list = queryClient.getQueryData<Order[]>(ORDER_QUERY_KEYS.list());
    expect(list?.[0]).toMatchObject({
      modelName: 'Robe',
      isSynced: false,
      client: { fullName: 'Awa Ndiaye' },
    });
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('cliente et changement de statut hors ligne sont mis en file', async () => {
    vi.spyOn(clientService, 'createClient');
    vi.spyOn(orderService, 'updateOrderStatus');
    const { queryClient, wrapper } = setup();
    const client = renderHook(() => useCreateClientMutation(), { wrapper });
    const status = renderHook(() => useUpdateOrderStatusMutation(), { wrapper });

    await act(async () => {
      await client.result.current.mutateAsync({
        fullName: 'Fatou',
        phone: '781234567',
        gender: 'F',
      });
      await status.result.current.mutateAsync({ id: 'o1', status: 'TERMINE' });
    });

    expect(await db.pendingMutations.count()).toBe(2);
    expect(queryClient.getQueryData<Order[]>(ORDER_QUERY_KEYS.list())?.[0].status).toBe('TERMINE');
    expect(clientService.createClient).not.toHaveBeenCalled();
  });

  it('useOfflineStatus : compte les éléments en attente et liste les échecs', async () => {
    await enqueueMutation('UPDATE_ORDER_STATUS', { id: 'o1', status: 'LIVRE' });
    const failed = await enqueueMutation('CREATE_CLIENT', {
      id: 'c9',
      fullName: 'Awa',
      phone: '77',
      gender: 'F',
    });
    await db.pendingMutations.update(failed.id, {
      status: 'needs_review',
      lastError: 'Téléphone déjà utilisé',
    });

    const { result } = renderHook(() => useOfflineStatus());

    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.isOnline).toBe(false);
    expect(result.current.failedMutations).toHaveLength(1);

    await act(async () => {
      await result.current.discardMutation(failed.id);
    });
    await waitFor(() => expect(result.current.failedMutations).toHaveLength(0));
  });
});

describe('indicateurs', () => {
  it('libellé « Hors ligne · N en attente »', () => {
    expect(buildSyncLabel(false, 2)).toBe('Hors ligne · 2 en attente');
    expect(buildSyncLabel(false, 0)).toBe('Hors ligne');
    expect(buildSyncLabel(true, 3)).toBe('3 en attente');
    expect(buildSyncLabel(true, 0)).toBeNull();
  });

  it('PendingSyncCard liste les échecs et permet de réessayer ou abandonner', () => {
    const onRetry = vi.fn();
    const onDiscard = vi.fn();
    const { rerender, container } = render(
      <PendingSyncCard
        failedMutations={[
          {
            id: 'm1',
            type: 'RECORD_PAYMENT',
            createdAt: 'x',
            retryCount: 0,
            status: 'needs_review',
            lastError: 'Trop-perçu',
            payload: { id: 'p1', amount: 5000, method: 'CASH', channel: 'ORDER_BALANCE' },
          },
        ]}
        onRetry={onRetry}
        onDiscard={onDiscard}
      />,
    );
    expect(screen.getByText(/Encaissement · 5\s000 FCFA/)).toBeInTheDocument();
    expect(screen.getByText('Trop-perçu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer : Encaissement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner : Encaissement' }));
    expect(onRetry).toHaveBeenCalledWith('m1');
    expect(onDiscard).toHaveBeenCalledWith('m1');

    rerender(<PendingSyncCard failedMutations={[]} onRetry={onRetry} onDiscard={onDiscard} />);
    expect(container).toBeEmptyDOMElement();
  });
});
