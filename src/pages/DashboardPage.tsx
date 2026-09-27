import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardQuery } from '@hooks/useDashboard';
import { useCreateOrderMutation } from '@hooks/useOrders';
import { useCreateClientMutation, useClientsQuery } from '@hooks/useClients';
import { useCreatePaymentMutation, useUnpaidOrdersQuery } from '@hooks/usePayments';
import {
  DashboardQuickActions,
  DashboardMetricsGrid,
  UrgentOrdersSection,
  RecentPaymentsSection,
  OrderModal,
  ClientModal,
  PaymentModal,
  LoadingSpinner,
} from '@components';
import { CreateOrderDto, CreateClientDto, RecordPaymentDto } from '@types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useDashboardQuery();

  const { data: clients = [] } = useClientsQuery();
  const { data: unpaidOrders = [] } = useUnpaidOrdersQuery();

  const createOrderMutation = useCreateOrderMutation();
  const createClientMutation = useCreateClientMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleCreateOrder = async (dto: CreateOrderDto) => {
    await createOrderMutation.mutateAsync(dto);
    setIsOrderModalOpen(false);
  };

  const handleCreateClient = async (dto: CreateClientDto) => {
    await createClientMutation.mutateAsync(dto);
    setIsClientModalOpen(false);
  };

  // La modale reste ouverte : PaymentModal affiche l'écran de reçu, puis se ferme
  // via son bouton « Fermer ». La réponse est transmise pour le reçu (n°, lien).
  const handleCreatePayment = (dto: RecordPaymentDto) => createPaymentMutation.mutateAsync(dto);

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner label="Chargement du tableau de bord..." />
      </div>
    );
  }

  const defaultMetrics = metrics || {
    activeOrdersCount: 0,
    urgentOrdersCount: 0,
    totalRemainingDue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    urgentOrders: [],
    recentPayments: [],
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <DashboardQuickActions
        onNewOrder={() => setIsOrderModalOpen(true)}
        onNewClient={() => setIsClientModalOpen(true)}
        onNewPayment={() => setIsPaymentModalOpen(true)}
      />

      {/* Primary KPI Metrics Grid */}
      <DashboardMetricsGrid
        metrics={defaultMetrics}
        onNavigatePayments={() => navigate('/payments')}
        onNavigateOrders={() => navigate('/orders')}
      />

      {/* Urgent Orders Section */}
      <UrgentOrdersSection
        urgentOrders={defaultMetrics.urgentOrders || []}
        urgentCount={defaultMetrics.urgentOrdersCount || 0}
        onViewAll={() => navigate('/orders')}
        onSelectOrder={(order) => navigate(`/orders?orderId=${order.id}`)}
      />

      {/* Recent Cash Inflows Section */}
      <RecentPaymentsSection
        payments={defaultMetrics.recentPayments || []}
        onViewAll={() => navigate('/payments')}
      />

      {/* Modals for Quick Actions */}
      {isOrderModalOpen && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSubmit={handleCreateOrder}
          clients={clients}
          isLoading={createOrderMutation.isPending}
        />
      )}

      {isClientModalOpen && (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSubmit={handleCreateClient}
          isLoading={createClientMutation.isPending}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmit={handleCreatePayment}
          unpaidOrders={unpaidOrders}
          isLoading={createPaymentMutation.isPending}
        />
      )}
    </div>
  );
};
