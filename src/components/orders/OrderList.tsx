import React from 'react';
import { Order, OrderStatus } from '@types';
import { OrderCard } from './OrderCard';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { EmptyState } from '@components/common/EmptyState';
import { ShoppingBag } from 'lucide-react';

export interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onUpdateStatus: (order: Order, nextStatus: OrderStatus | string) => Promise<void> | void;
  onRecordPayment: (order: Order) => void;
  onViewFabric?: (url: string) => void;
  onPreviewFabric?: (url: string) => void;
  onViewMeasurements: (order: Order) => void;
  onSendWhatsApp?: (order: Order) => void;
  onNewOrder: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading,
  onUpdateStatus,
  onRecordPayment,
  onViewFabric,
  onPreviewFabric,
  onViewMeasurements,
  onSendWhatsApp,
  onNewOrder,
}) => {
  if (isLoading) {
    return <LoadingSpinner label="Chargement des commandes de l'atelier..." />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Aucune commande trouvée"
        description="Créez votre première commande pour suivre la confection, les délais et les acomptes."
        actionLabel="Créer une commande"
        onAction={onNewOrder}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onUpdateStatus={onUpdateStatus}
          onRecordPayment={onRecordPayment}
          onViewFabric={onViewFabric}
          onPreviewFabric={onPreviewFabric}
          onViewMeasurements={onViewMeasurements}
          onSendWhatsApp={onSendWhatsApp}
        />
      ))}
    </div>
  );
};
