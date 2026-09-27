import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ORDER_QUERY_KEYS, useOrdersQuery } from './useOrders';
import { CLIENT_QUERY_KEYS } from './useClients';
import { PAYMENT_QUERY_KEYS, useUnpaidOrdersQuery } from './usePayments';
import { orderService } from '@services/api/order.service';
import { createTestQueryClient } from '../testUtils';
import type { Order } from '@types';

const make = (id: string, deadline: string, extra: Partial<Order> = {}): Order => ({
  id,
  workshopId: 'ws-1',
  clientId: 'c',
  orderNumber: `AW-${id}`,
  modelName: `Modèle ${id}`,
  totalAmount: 10000,
  totalPaid: 0,
  remainingBalance: 10000,
  status: 'EN_COURS',
  deliveryDeadline: deadline,
  createdAt: deadline,
  ...extra,
});

const orders = [
  make('1', '2026-10-05'),
  make('2', '2026-10-01', { remainingBalance: 0 }),
  make('3', '2026-10-03', { status: 'ANNULE' }),
];

describe('cache des commandes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('tailor_workshop_id', 'ws-1');
  });

  it('ARC-1 : les clés de lecture incluent l’atelier actif', () => {
    expect(ORDER_QUERY_KEYS.list()).toEqual(['orders', 'ws-1', { status: undefined }]);
    expect(CLIENT_QUERY_KEYS.list('awa')).toEqual(['clients', 'ws-1', { search: 'awa' }]);
    expect(PAYMENT_QUERY_KEYS.list()).toEqual(['payments', 'ws-1']);
  });

  it('PERF-2 : liste et commandes à encaisser partagent un seul chargement', async () => {
    const listOrders = vi.spyOn(orderService, 'listOrders').mockResolvedValue(orders);
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => ({ all: useOrdersQuery(), unpaid: useUnpaidOrdersQuery() }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.unpaid.isSuccess).toBe(true));
    expect(listOrders).toHaveBeenCalledTimes(1);
    // Liste complète triée par échéance, comme avant.
    expect(result.current.all.data?.map((o) => o.id)).toEqual(['2', '3', '1']);
    // À encaisser : reliquat > 0 et non annulée, dans l'ordre de l'API.
    expect(result.current.unpaid.data?.map((o) => o.id)).toEqual(['1']);
  });

  it('filtre la recherche sans nouvel appel réseau', async () => {
    vi.spyOn(orderService, 'listOrders').mockResolvedValue(orders);
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useOrdersQuery('ALL', 'modèle 3'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((o) => o.id)).toEqual(['3']);
  });
});
