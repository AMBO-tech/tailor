import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedList } from './usePagedList';
import { paymentService } from '@services/api/payment.service';
import { v4 as uuidv4 } from 'uuid';
import { RecordPaymentDto, RecordPaymentResponse, Order, PaymentEntry } from '@types';
import { buildOptimisticPayment, mergePendingPayments, runOrQueue } from '@services/offlineQueue';
import {
  findInCachedLists,
  isQueuedEntity,
  notifyQueued,
  prependToCachedLists,
  updateCachedOrder,
} from './offlineCache';
import { toast } from '@services/toast';
import { markErrorNotified } from '@utils/errors';
import { getActiveWorkshopId } from '@utils/storage';
import { ORDER_QUERY_KEYS, fetchOrders } from './useOrders';

/** Clés du cache des encaissements (`all` = préfixe d'invalidation, ARC-1). */
export const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  list: () => ['payments', getActiveWorkshopId()] as const,
  /** Liste paginée de l'écran Caisse (« Charger plus »). */
  pages: () => ['payments', getActiveWorkshopId(), 'pages'] as const,
};

/** Commandes avec un reliquat à encaisser (hors commandes annulées). */
export function selectUnpaidOrders(orders: Order[]): Order[] {
  return orders.filter((o) => {
    const remaining =
      o.remainingBalance !== undefined
        ? Number(o.remainingBalance)
        : Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.totalPaid) || 0));
    return remaining > 0 && o.status !== 'ANNULE';
  });
}

export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.list(),
    queryFn: async () => {
      const payments = await paymentService.listPayments();
      // Les encaissements enregistrés hors ligne restent visibles.
      const list = await mergePendingPayments(Array.isArray(payments) ? payments : []);
      return list.sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      );
    },
  });
}

/**
 * Encaissements de l'écran Caisse, par pages de 30 (`?limit=30&cursor=`).
 * La 1re page inclut les encaissements enregistrés hors ligne.
 */
export function usePaymentPagesQuery() {
  return usePagedList<PaymentEntry>({
    queryKey: PAYMENT_QUERY_KEYS.pages(),
    fetchPage: (cursor) => paymentService.listPaymentsPage(cursor),
    transformPage: async (payments, isFirstPage) =>
      isFirstPage ? mergePendingPayments(payments) : payments,
  });
}

/**
 * Commandes à encaisser. Réutilise le cache de la liste complète des commandes
 * (même clé et même chargement que `useOrdersQuery()`) et filtre via `select` :
 * la liste n'est plus téléchargée deux fois (PERF-2).
 */
export function useUnpaidOrdersQuery() {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.list(),
    queryFn: () => fetchOrders(),
    select: selectUnpaidOrders,
  });
}

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // 'always' : la mutation s'exécute aussi hors ligne (elle est alors mise en file).
    networkMode: 'always',
    mutationFn: async (data: RecordPaymentDto): Promise<RecordPaymentResponse> => {
      const payload = { ...data, id: data.id ?? uuidv4() };
      const { result } = await runOrQueue(
        'RECORD_PAYMENT',
        payload,
        () => paymentService.recordPayment(payload),
        (): RecordPaymentResponse =>
          buildOptimisticPayment(
            payload,
            findInCachedLists<Order>(queryClient, ['orders'], payload.orderId),
          ),
      );
      return result;
    },
    onSuccess: (res) => {
      if (isQueuedEntity(res)) {
        prependToCachedLists(queryClient, PAYMENT_QUERY_KEYS.all, res);
        if (res.orderId) {
          updateCachedOrder(queryClient, res.orderId, (o) => {
            const totalPaid = (Number(o.totalPaid) || 0) + res.amount;
            return {
              ...o,
              totalPaid,
              remainingBalance: Math.max(0, (Number(o.totalAmount) || 0) - totalPaid),
            };
          });
        }
        notifyQueued();
        return;
      }
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const formatted = new Intl.NumberFormat('fr-FR').format(Number(res.amount) || 0);
      toast.success(`Encaissement de ${formatted} FCFA enregistré ✨`);
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || "Erreur lors de l'enregistrement de l'encaissement");
    },
  });
}

export const useCreatePaymentMutation = useRecordPaymentMutation;
