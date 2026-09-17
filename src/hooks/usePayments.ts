import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@services/api/payment.service';
import { orderService } from '@services/api/order.service';
import { RecordPaymentDto, RecordPaymentResponse, Order } from '@types';
import { toast } from '@services/toast';

export const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  unpaidOrders: ['orders', 'unpaid'] as const,
};

export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.all,
    queryFn: async () => {
      const payments = await paymentService.listPayments();
      const list = Array.isArray(payments) ? payments : [];
      return list.sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      );
    },
  });
}

export function useUnpaidOrdersQuery() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.unpaidOrders,
    queryFn: async (): Promise<Order[]> => {
      const orders = await orderService.listOrders();
      if (!Array.isArray(orders)) return [];
      return orders.filter((o) => {
        const remaining =
          o.remainingBalance !== undefined
            ? Number(o.remainingBalance)
            : Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.totalPaid) || 0));
        return remaining > 0 && o.status !== 'ANNULE';
      });
    },
  });
}

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentDto): Promise<RecordPaymentResponse> =>
      paymentService.recordPayment(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const formatted = new Intl.NumberFormat('fr-FR').format(Number(res.amount) || 0);
      toast.success(`Encaissement de ${formatted} FCFA enregistré ✨`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'enregistrement de l'encaissement");
    },
  });
}

export const useCreatePaymentMutation = useRecordPaymentMutation;
