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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-100">Délais & Urgences Proches</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
        >
          Voir tout <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    #{order.orderNumber}
                  </span>
                  <span className="font-semibold text-sm text-slate-200 truncate">
                    {order.client?.fullName || 'Client'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{order.modelName}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(order.deliveryDeadline)}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-1.5" />
          Aucune commande urgente en souffrance. Tout est sous contrôle !
        </div>
      )}
    </div>
  );
};
