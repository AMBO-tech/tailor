import React from 'react';
import { Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface UrgentOrdersListProps {
  orders: any[];
  onViewAll: () => void;
}

export const UrgentOrdersList: React.FC<UrgentOrdersListProps> = ({ orders, onViewAll }) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Délais & Urgences Proches</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
        >
          Voir tout <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-300 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600">
                    #{order.orderNumber}
                  </span>
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {order.client?.fullName || 'Client'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{order.modelName}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-rose-600 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(order.deliveryDeadline)}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
          Aucune commande urgente en attente.
        </div>
      )}
    </div>
  );
};
