/** Listes paginées « Charger plus » (?limit=30&cursor=) et chiffre d'affaires masqué. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { AppRoutes } from '@routes';
import { ToastContainer } from '@components/common';
import { renderWithProviders, createTestQueryClient } from '../testUtils';
import { installFakeApi, seedSession, type FakeDb } from '../testFakeApi';
import { buildPageUrl, LIST_PAGE_SIZE, toCursorPage } from '@services/api/pagination';
import { flattenPages } from '@hooks/usePagedList';
import {
  findInCachedLists,
  isPagedListData,
  prependToCachedLists,
  updateCachedOrder,
} from '@hooks/offlineCache';
import type { CursorPage, Order } from '@types';

function renderApp(route: string) {
  return renderWithProviders(
    <>
      <ToastContainer />
      <AppRoutes />
    </>,
    createTestQueryClient(),
    route,
  );
}

/** Ajoute `count` commandes numérotées (échéances croissantes, après les commandes de base). */
function seedManyOrders(db: FakeDb, count: number) {
  const template = db.orders[0];
  for (let i = 1; i <= count; i += 1) {
    const n = String(i).padStart(3, '0');
    db.orders.push({
      ...template,
      id: `bulk-o${n}`,
      orderNumber: `BULK-${n}`,
      modelName: `Modèle ${n}`,
      deliveryDeadline: `2026-12-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    });
  }
}

function listCalls(fetchMock: ReturnType<typeof vi.fn>, path: string): string[] {
  return fetchMock.mock.calls
    .map(([url]) => String(url))
    .filter((url) => new URL(url).pathname === path);
}

describe('listes paginées (« Charger plus »)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    seedSession();
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it('commandes : 30 par page, « Charger plus » ajoute la suite puis disparaît', async () => {
    const { db, fetchMock } = installFakeApi();
    seedManyOrders(db, 35); // 2 commandes de base + 35 = 37
    renderApp('/orders');

    await screen.findByText('Modèle 001');
    expect(screen.queryByText('Modèle 035')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Charger plus/ }));
    expect(await screen.findByText('Modèle 035')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Charger plus/ })).not.toBeInTheDocument(),
    );

    const calls = listCalls(fetchMock, '/orders');
    expect(calls.some((url) => url.endsWith(`/orders?limit=${LIST_PAGE_SIZE}`))).toBe(true);
    expect(calls.some((url) => url.includes(`limit=${LIST_PAGE_SIZE}&cursor=bulk-o028`))).toBe(
      true,
    );
  });

  it('commandes : le filtre de statut est transmis avec la pagination', async () => {
    const { fetchMock } = installFakeApi();
    renderApp('/orders');
    await screen.findByText('Robe marinière');
    fireEvent.click(screen.getByRole('button', { name: /Terminées/ }));
    await waitFor(() =>
      expect(
        listCalls(fetchMock, '/orders').some((url) => url.includes('status=TERMINE&limit=30')),
      ).toBe(true),
    );
    expect(screen.queryByRole('button', { name: /Charger plus/ })).not.toBeInTheDocument();
  });

  it('clientes : pagination et recherche serveur combinées', async () => {
    const { db, fetchMock } = installFakeApi();
    for (let i = 1; i <= 31; i += 1) {
      db.clients.push({
        ...db.clients[1],
        id: `bulk-c${i}`,
        fullName: `Zeynab ${String(i).padStart(2, '0')}`,
      });
    }
    renderApp('/clients');
    await screen.findByText('Fatou Diop');
    expect(screen.queryByText('Zeynab 31')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Charger plus/ }));
    expect(await screen.findByText('Zeynab 31')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher/), { target: { value: 'fatou' } });
    await waitFor(() =>
      expect(listCalls(fetchMock, '/clients').some((url) => url.includes('q=fatou&limit=30'))).toBe(
        true,
      ),
    );
    await waitFor(() => expect(screen.queryByText('Zeynab 01')).not.toBeInTheDocument());
  });

  it('encaissements : « Charger plus » en bas du journal', async () => {
    const { db } = installFakeApi();
    const template = db.payments[0];
    for (let i = 1; i <= 32; i += 1) {
      db.payments.push({
        ...template,
        id: `bulk-p${i}`,
        receiptNumber: `REC-BULK-${String(i).padStart(2, '0')}`,
      });
    }
    renderApp('/payments');
    await screen.findByText('#REC-BULK-01');
    expect(screen.queryByText('#REC-BULK-32')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Charger plus/ }));
    expect(await screen.findByText('#REC-BULK-32')).toBeInTheDocument();
  });
});

describe('tableau de bord : chiffre d’affaires masqué', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    seedSession();
  });

  it('affiche le chiffre du mois par défaut', async () => {
    installFakeApi();
    renderApp('/');
    expect(await screen.findByText('Chiffre du mois')).toBeInTheDocument();
    expect(screen.getByText(/Semaine:/)).toBeInTheDocument();
  });

  it('masque le chiffre du mois et de la semaine quand revenueHidden', async () => {
    const { db } = installFakeApi();
    db.revenueHidden = true;
    renderApp('/');
    expect(await screen.findByText('Reliquats à encaisser')).toBeInTheDocument();
    expect(screen.queryByText('Chiffre du mois')).not.toBeInTheDocument();
    expect(screen.queryByText(/Semaine:/)).not.toBeInTheDocument();
  });
});

describe('pagination : outils', () => {
  it('toCursorPage accepte un tableau, une page ou une réponse vide', () => {
    expect(toCursorPage([1, 2])).toEqual({ data: [1, 2], nextCursor: null });
    expect(toCursorPage({ data: [3], nextCursor: 'c3' })).toEqual({ data: [3], nextCursor: 'c3' });
    expect(toCursorPage(null)).toEqual({ data: [], nextCursor: null });
  });

  it('buildPageUrl conserve les filtres non vides puis ajoute limit et cursor', () => {
    expect(buildPageUrl('/orders', { status: undefined })).toBe('/orders?limit=30');
    expect(buildPageUrl('/clients', { q: 'awa diop' }, 'c-9')).toBe(
      '/clients?q=awa+diop&limit=30&cursor=c-9',
    );
  });

  it('flattenPages concatène sans doublon', () => {
    const pages = [
      { data: [{ id: 'a' }, { id: 'b' }], nextCursor: 'b' },
      { data: [{ id: 'b' }, { id: 'c' }], nextCursor: null },
    ];
    expect(flattenPages(pages).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(flattenPages(undefined)).toEqual([]);
  });

  it('cache hors ligne : ajout, mise à jour et recherche dans une liste paginée', () => {
    const queryClient = new QueryClient();
    const key = ['orders', 'ws-1', 'pages', { status: undefined }];
    const order = (id: string, totalPaid = 0) => ({ id, totalPaid, totalAmount: 1000 }) as Order;
    queryClient.setQueryData<InfiniteData<CursorPage<Order>, string | undefined>>(key, {
      pages: [
        { data: [order('o1')], nextCursor: 'o1' },
        { data: [order('o2')], nextCursor: null },
      ],
      pageParams: [undefined, 'o1'],
    });

    prependToCachedLists(queryClient, ['orders'], order('o-offline'));
    updateCachedOrder(queryClient, 'o2', (o) => ({ ...o, totalPaid: 500 }));

    const data = queryClient.getQueryData<InfiniteData<CursorPage<Order>>>(key);
    expect(isPagedListData(data)).toBe(true);
    expect(data?.pages[0].data.map((o) => o.id)).toEqual(['o-offline', 'o1']);
    expect(data?.pages[1].data[0].totalPaid).toBe(500);
    expect(findInCachedLists<Order>(queryClient, ['orders'], 'o2')?.totalPaid).toBe(500);
    expect(isPagedListData({ pages: [{ nope: true }] })).toBe(false);
  });
});
