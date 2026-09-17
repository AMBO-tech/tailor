import React from 'react';
import { PaymentEntry } from '@types';
import { PaymentCard } from './PaymentCard';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { EmptyState } from '@components/common/EmptyState';
import { Wallet } from 'lucide-react';

export interface PaymentListProps {
  payments: PaymentEntry[];
  isLoading: boolean;
  onNewPayment: () => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  isLoading,
  onNewPayment,
}) => {
  if (isLoading) {
    return <LoadingSpinner label="Chargement du journal des versements..." />;
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Aucun paiement enregistré"
        description="Enregistrez les acomptes ou les soldes réglés par vos clientes pour générer des reçus."
        actionLabel="Encaisser un versement"
        onAction={onNewPayment}
      />
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <PaymentCard key={payment.id} payment={payment} />
      ))}
    </div>
  );
};
