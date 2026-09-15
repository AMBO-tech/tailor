import React from 'react';

export type OrderStatus = 'DRAFT' | 'CUTTING' | 'SEWING' | 'FITTING_READY' | 'COMPLETED' | 'DELIVERED';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<OrderStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    CUTTING: { label: 'Coupe en cours', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
    SEWING: { label: 'Couture', color: 'bg-amber-950 text-amber-300 border-amber-800' },
    FITTING_READY: { label: 'Prêt Essayage', color: 'bg-purple-950 text-purple-300 border-purple-800' },
    COMPLETED: { label: 'Terminé / Prêt', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    DELIVERED: { label: 'Livré au client', color: 'bg-slate-900 text-slate-400 border-slate-800' },
  };

  const config = configs[status] || { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={inline-flex items-center font-semibold rounded-full border  }>
      {config.label}
    </span>
  );
};
