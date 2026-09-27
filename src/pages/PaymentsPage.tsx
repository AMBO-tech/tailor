import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  usePaymentPagesQuery,
  useCreatePaymentMutation,
  useUnpaidOrdersQuery,
} from '@hooks/usePayments';
import {
  PaymentSummaryBanner,
  PaymentList,
  PaymentModal,
  LoadMoreButton,
} from '@components';
import { RecordPaymentDto } from '@types';

export const PaymentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(Boolean(preselectedOrderId));

  // Pages de 30 versements (`?limit=30&cursor=`) ; « Charger plus » ajoute la suivante.
  // Le bandeau totalise les versements affichés.
  const {
    data: rawPayments,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = usePaymentPagesQuery();
  const { data: unpaidOrders = [] } = useUnpaidOrdersQuery();
  const createPaymentMutation = useCreatePaymentMutation();

  const sortedPayments = useMemo(() => {
    const list = Array.isArray(rawPayments) ? [...rawPayments] : [];
    return list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [rawPayments]);

  const totalEncaisse = useMemo(() => {
    return sortedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [sortedPayments]);

  // La modale reste ouverte : PaymentModal affiche l'écran de reçu, puis se ferme
  // via son bouton « Fermer ». La réponse est transmise pour le reçu (n°, lien).
  const handleCreatePayment = (dto: RecordPaymentDto) => createPaymentMutation.mutateAsync(dto);

  return (
    <div className="space-y-4">
      {/* Top Banner: Total Encaisse */}
      <PaymentSummaryBanner
        totalAmount={totalEncaisse}
        paymentsCount={sortedPayments.length}
        onNewPayment={() => setIsModalOpen(true)}
      />

      {/* Payments List */}
      <PaymentList
        payments={sortedPayments}
        isLoading={isLoading}
        onNewPayment={() => setIsModalOpen(true)}
      />
      <LoadMoreButton hasMore={hasNextPage} isLoading={isFetchingNextPage} onLoadMore={loadMore} />

      {/* Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePayment}
          unpaidOrders={unpaidOrders}
          preselectedOrderId={preselectedOrderId}
          isLoading={createPaymentMutation.isPending}
        />
      )}
    </div>
  );
};
