import React from 'react';
import { Order } from '@types';
import { Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface UrgentOrdersSectionProps {
  urgentOrders: Order[] | undefined;
  urgentCount?: number;
  onViewAll?: () => void;
  onSelectOrder?: (order: Order) => void;
}

export const UrgentOrdersSection: React.FC<UrgentOrdersSectionProps> = ({
  urgentOrders = [],
  urgentCount,
  onViewAll,
  onSelectOrder,
}) => {
  const navigate = useNavigate();

  const handleViewAll = onViewAll || (() => navigate('/orders'));
  const count = urgentCount !== undefined ? urgentCount : urgentOrders.length;

  if (urgentOrders.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
          <h3 className="font-display font-bold text-xs">
            Urgences & Délais proches ({count})
          </h3>
        </div>
        <button
          onClick={handleViewAll}
          className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-0.5"
        >
          Voir tout
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {urgentOrders.slice(0, 3).map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder ? onSelectOrder(order) : navigate('/orders')}
            className="bg-white rounded-xl p-3 border border-rose-200 flex items-center justify-between text-xs cursor-pointer hover:shadow-xs transition"
          >
            <div>
              <span className="font-bold text-slate-900 block">{order.modelName}</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {order.client?.fullName || 'Cliente'} • #{order.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{formatDate(order.deliveryDeadline)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
