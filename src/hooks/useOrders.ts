import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@services/api/order.service';
import { CreateOrderDto, OrderStatus } from '@types';
import { toast } from '@services/toast';

export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  list: (status?: string, search?: string) => ['orders', { status, search }] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useOrdersQuery(statusFilter?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.list(statusFilter, searchQuery),
    queryFn: async () => {
      const orders = await orderService.listOrders(
        statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
      );
      let list = Array.isArray(orders) ? orders : [];
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
        (a, b) =>
          new Date(a.deliveryDeadline).getTime() -
          new Date(b.deliveryDeadline).getTime(),
      );
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
    mutationFn: (data: CreateOrderDto) => orderService.createOrder(data),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Commande #${newOrder.orderNumber || ''} créée avec succès ✨`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la création de la commande');
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus | string }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
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
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la mise à jour du statut');
    },
  });
}
