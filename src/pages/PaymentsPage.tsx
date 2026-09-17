import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  usePaymentsQuery,
  useCreatePaymentMutation,
  useUnpaidOrdersQuery,
} from '@hooks/usePayments';
import {
  PaymentSummaryBanner,
  PaymentList,
  PaymentModal,
} from '@components';
import { RecordPaymentDto } from '@types';

export const PaymentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId') || undefined;

  const [isModalOpen, setIsModalOpen] = useState(Boolean(preselectedOrderId));

  const { data: rawPayments = [], isLoading } = usePaymentsQuery();
  const { data: unpaidOrders = [] } = useUnpaidOrdersQuery();
  const createPaymentMutation = useCreatePaymentMutation();

  const sortedPayments = useMemo(() => {
    let list = Array.isArray(rawPayments) ? [...rawPayments] : [];
    return list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [rawPayments]);

  const totalEncaisse = useMemo(() => {
    return sortedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [sortedPayments]);

  const handleCreatePayment = async (dto: RecordPaymentDto) => {
    await createPaymentMutation.mutateAsync(dto);
    setIsModalOpen(false);
  };

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
