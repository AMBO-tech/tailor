import React, { useState, useMemo } from 'react';
import {
  useOrderPagesQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} from '@hooks/useOrders';
import { useClientsQuery } from '@hooks/useClients';
import { useCreatePaymentMutation, useUnpaidOrdersQuery } from '@hooks/usePayments';
import {
  OrderSearchInput,
  OrderStatusFilter,
  OrderList,
  OrderModal,
  OrderFabricPreviewModal,
  MeasurementDrawerModal,
  PaymentModal,
  LoadMoreButton,
} from '@components';
import { Order, CreateOrderDto, RecordPaymentDto } from '@types';
import { toast } from '@services/toast';

export const OrdersPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedFabricPreview, setSelectedFabricPreview] = useState<string | null>(null);
  const [selectedOrderForMeasurements, setSelectedOrderForMeasurements] = useState<Order | null>(null);

  // Pages de 30 commandes (`?limit=30&cursor=`) ; « Charger plus » ajoute la suivante.
  const {
    data: rawOrders,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useOrderPagesQuery(statusFilter !== 'ALL' ? statusFilter : undefined);
  const { data: clients = [] } = useClientsQuery();
  const { data: unpaidOrders = [] } = useUnpaidOrdersQuery();

  const createOrderMutation = useCreateOrderMutation();
  const updateStatusMutation = useUpdateOrderStatusMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(rawOrders) ? [...rawOrders] : [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
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
        new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime(),
    );
  }, [rawOrders, searchQuery]);

  const handleCreateOrder = async (dto: CreateOrderDto) => {
    await createOrderMutation.mutateAsync(dto);
    setIsOrderModalOpen(false);
  };

  const handleUpdateStatus = async (order: Order, nextStatus: string) => {
    await updateStatusMutation.mutateAsync({
      id: order.id,
      status: nextStatus,
    });
  };

  const handleRecordPaymentForOrder = (order: Order) => {
    setSelectedOrderForPayment(order);
    setIsPaymentModalOpen(true);
  };

  // La modale reste ouverte : PaymentModal affiche l'écran de reçu, puis se ferme
  // via son bouton « Fermer ». La réponse est transmise pour le reçu (n°, lien).
  const handleCreatePayment = (dto: RecordPaymentDto) => createPaymentMutation.mutateAsync(dto);

  const handleSendWhatsApp = (order: Order) => {
    const clientPhone = order.client?.phone || '';
    if (!clientPhone) {
      toast.warning('Numéro client non renseigné');
      return;
    }
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;

    const remBalance =
      order.remainingBalance !== undefined
        ? Number(order.remainingBalance)
        : Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.totalPaid) || 0));

    let msg = `Bonjour ${order.client?.fullName || ''}, votre commande *${order.modelName}* (#${order.orderNumber}) `;
    if (order.status === 'TERMINE') {
      msg += `est *prête* à l'atelier ! ✨`;
      if (remBalance > 0) {
        msg += ` Reliquat à régler : ${new Intl.NumberFormat('fr-FR').format(remBalance)} FCFA.`;
      }
    } else if (order.status === 'LIVRE') {
      msg += `vous a bien été livrée. Merci de votre confiance chez *Sama Waay* ! ✂️`;
    } else if (order.status === 'ANNULE') {
      msg += `a été annulée.`;
    } else {
      msg += `est en cours de confection. Date de livraison prévue : ${new Date(
        order.deliveryDeadline,
      ).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}.`;
    }

    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-3.5">
      {/* Header Search & Create */}
      <OrderSearchInput
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewOrder={() => setIsOrderModalOpen(true)}
      />

      {/* Filter Tabs */}
      <OrderStatusFilter
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Orders List */}
      <OrderList
        orders={filteredOrders}
        isLoading={isLoading}
        onUpdateStatus={handleUpdateStatus}
        onRecordPayment={handleRecordPaymentForOrder}
        onViewMeasurements={(order) => setSelectedOrderForMeasurements(order)}
        onPreviewFabric={(url) => setSelectedFabricPreview(url)}
        onSendWhatsApp={handleSendWhatsApp}
        onNewOrder={() => setIsOrderModalOpen(true)}
      />
      <LoadMoreButton hasMore={hasNextPage} isLoading={isFetchingNextPage} onLoadMore={loadMore} />

      {/* Fabric Preview Modal */}
      {selectedFabricPreview && (
        <OrderFabricPreviewModal
          imageUrl={selectedFabricPreview}
          onClose={() => setSelectedFabricPreview(null)}
        />
      )}

      {/* Measurement Drawer Modal */}
      {selectedOrderForMeasurements && (
        <MeasurementDrawerModal
          isOpen={Boolean(selectedOrderForMeasurements)}
          onClose={() => setSelectedOrderForMeasurements(null)}
          clientName={selectedOrderForMeasurements.client?.fullName}
          modelName={selectedOrderForMeasurements.modelName}
          measurements={selectedOrderForMeasurements.measurementSnapshot || {}}
          isReadOnly={true}
        />
      )}

      {/* Create Order Modal */}
      {isOrderModalOpen && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={handleCreateOrder}
          clients={clients}
          isLoading={createOrderMutation.isPending}
        />
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedOrderForPayment(null);
          }}
          onSubmit={handleCreatePayment}
          unpaidOrders={unpaidOrders}
          preselectedOrderId={selectedOrderForPayment?.id}
          isLoading={createPaymentMutation.isPending}
        />
      )}
    </div>
  );
};
