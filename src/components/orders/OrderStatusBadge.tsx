import React from 'react';
import { OrderStatus } from '@types';

export interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<string, { label: string; color: string; dot: string }> = {
    EN_COURS: {
      label: 'En cours',
      color: 'bg-amber-50 text-amber-900 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    TERMINE: {
      label: 'Terminé',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    LIVRE: {
      label: 'Livré',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
    ANNULE: {
      label: 'Annulé',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.color} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
