import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedList } from './usePagedList';
import { orderService } from '@services/api/order.service';
import { v4 as uuidv4 } from 'uuid';
import { Client, CreateOrderDto, Order, OrderStatus } from '@types';
import {
  applyPendingOrderChanges,
  buildOptimisticOrder,
  mergePendingOrders,
  runOrQueue,
} from '@services/offlineQueue';
import {
  findInCachedLists,
  isQueuedEntity,
  notifyQueued,
  prependToCachedLists,
  updateCachedOrder,
} from './offlineCache';
import { getActiveWorkshopId } from '@utils/storage';
import { toast } from '@services/toast';
import { markErrorNotified } from '@utils/errors';

/**
 * Clés du cache des commandes. `all` sert de préfixe d'invalidation ; les clés de
 * lecture incluent l'atelier actif (ARC-1) pour ne jamais mélanger deux ateliers.
 */
export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  list: (status?: string) => ['orders', getActiveWorkshopId(), { status }] as const,
  /** Liste paginée de l'écran Commandes (« Charger plus »). */
  pages: (status?: string) => ['orders', getActiveWorkshopId(), 'pages', { status }] as const,
  detail: (id: string) => ['orders', getActiveWorkshopId(), 'detail', id] as const,
};

/** Normalise le filtre de statut (« ALL » = aucun filtre côté API). */
function normalizeStatus(statusFilter?: string): string | undefined {
  return statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined;
}

/**
 * Charge la liste brute des commandes. Partagée par `useOrdersQuery` et
 * `useUnpaidOrdersQuery` (même clé de cache) : un seul appel réseau (PERF-2).
 */
export async function fetchOrders(statusFilter?: string): Promise<Order[]> {
  const orders = await orderService.listOrders(normalizeStatus(statusFilter));
  // Les créations et changements de statut hors ligne restent visibles.
  const merged = await mergePendingOrders(Array.isArray(orders) ? orders : []);
  const status = normalizeStatus(statusFilter);
  return status ? merged.filter((o) => o.status === status) : merged;
}

/** Filtre de recherche (numéro, modèle, nom ou téléphone) puis tri par échéance. */
function filterAndSortOrders(orders: Order[], searchQuery?: string): Order[] {
  let list = [...orders];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.modelName?.toLowerCase().includes(q) ||
        o.client?.fullName?.toLowerCase().includes(q) ||
        o.client?.phone?.includes(q),
    );
  }
  return list.sort(
    (a, b) => new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime(),
  );
}

export function useOrdersQuery(statusFilter?: string, searchQuery?: string) {
  const status = normalizeStatus(statusFilter);
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.list(status),
    queryFn: () => fetchOrders(status),
    select: (orders: Order[]) => filterAndSortOrders(orders, searchQuery),
  });
}

/**
 * Commandes de l'écran Commandes, par pages de 30 (`?limit=30&cursor=`).
 * La 1re page inclut les commandes créées hors ligne ; chaque page reçoit les
 * changements de statut et encaissements en attente.
 */
export function useOrderPagesQuery(statusFilter?: string) {
  const status = normalizeStatus(statusFilter);
  return usePagedList<Order>({
    queryKey: ORDER_QUERY_KEYS.pages(status),
    fetchPage: (cursor) => orderService.listOrdersPage(status, cursor),
    transformPage: async (orders, isFirstPage) => {
      const merged = isFirstPage ? await mergePendingOrders(orders) : await applyPendingOrderChanges(orders);
      return status ? merged.filter((o) => o.status === status) : merged;
    },
  });
}

export function useOrderQuery(id?: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(id || ''),
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // 'always' : la mutation s'exécute aussi hors ligne (elle est alors mise en file).
    networkMode: 'always',
    mutationFn: async (data: CreateOrderDto) => {
      const payload = { ...data, id: data.id ?? uuidv4() };
      const { result } = await runOrQueue(
        'CREATE_ORDER',
        payload,
        () => orderService.createOrder(payload),
        () =>
          buildOptimisticOrder(
            payload,
            findInCachedLists<Client>(queryClient, ['clients'], payload.clientId),
          ),
      );
      return result;
    },
    onSuccess: (newOrder) => {
      if (isQueuedEntity(newOrder)) {
        prependToCachedLists(queryClient, ORDER_QUERY_KEYS.all, newOrder);
        notifyQueued();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Commande #${newOrder.orderNumber || ''} créée avec succès ✨`);
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || 'Erreur lors de la création de la commande');
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus | string }) => {
      const { result } = await runOrQueue(
        'UPDATE_ORDER_STATUS',
        { id, status: status as OrderStatus },
        () => orderService.updateOrderStatus(id, status),
        (): Order => {
          const cached = findInCachedLists<Order>(queryClient, ['orders'], id);
          return { ...(cached as Order), id, status: status as OrderStatus, isSynced: false };
        },
      );
      return result;
    },
    onSuccess: (updatedOrder) => {
      if (isQueuedEntity(updatedOrder)) {
        updateCachedOrder(queryClient, updatedOrder.id, (o) => ({ ...o, status: updatedOrder.status }));
        notifyQueued();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const statusLabels: Record<string, string> = {
        EN_COURS: 'en cours ✂️',
        TERMINE: 'terminée ✨',
        LIVRE: 'livrée 📦',
        ANNULE: 'annulée ❌',
      };
      toast.success(
        `Commande #${updatedOrder.orderNumber} : ${statusLabels[updatedOrder.status] || updatedOrder.status}`,
      );
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || 'Erreur lors de la mise à jour du statut');
    },
  });
}
