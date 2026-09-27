import React from 'react';
import { DashboardMetrics } from '@types';
import { StatCard } from '@components/common/StatCard';
import { Wallet, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface DashboardMetricsGridProps {
  metrics: DashboardMetrics | undefined;
  onNavigatePayments?: () => void;
  onNavigateOrders?: () => void;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  metrics,
  onNavigatePayments,
  onNavigateOrders,
}) => {
  const navigate = useNavigate();

  const handlePayments = onNavigatePayments || (() => navigate('/payments'));
  const handleOrders = onNavigateOrders || (() => navigate('/orders'));

  const formatMoney = (amount: number | undefined) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' F';
  };

  // Chiffre d'affaires masqué par l'API (employé) : la carte n'est pas affichée
  // et les reliquats occupent toute la ligne.
  const isRevenueHidden = metrics?.revenueHidden === true;

  const remainingDueCard = (
    <StatCard
      label="Reliquats à encaisser"
      value={formatMoney(metrics?.totalRemainingDue)}
      icon={Wallet}
      variant="amber"
      subText="Sommes dues par les clientes"
      onClick={handleOrders}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {isRevenueHidden ? <div className="col-span-2">{remainingDueCard}</div> : remainingDueCard}

      {!isRevenueHidden && (
        <StatCard
          label="Chiffre du mois"
          value={formatMoney(metrics?.monthlyRevenue)}
          icon={TrendingUp}
          variant="emerald"
          subText={`Semaine: ${formatMoney(metrics?.weeklyRevenue)}`}
          onClick={handlePayments}
        />
      )}

      <StatCard
        label="Commandes en cours"
        value={metrics?.activeOrdersCount || 0}
        icon={ShoppingBag}
        variant="slate"
        subText="En atelier"
        onClick={handleOrders}
      />

      <StatCard
        label="Urgences (-48h)"
        value={metrics?.urgentOrdersCount || 0}
        icon={AlertTriangle}
        variant={metrics?.urgentOrdersCount ? 'rose' : 'slate'}
        subText={metrics?.urgentOrdersCount ? 'À livrer bientôt !' : 'À jour'}
        onClick={handleOrders}
      />
    </div>
  );
};
