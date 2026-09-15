import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  PlusCircle,
  Users,
  Calendar,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { TabType } from '../components/BottomNav';

interface DashboardScreenProps {
  onNavigate: (tab: TabType) => void;
  onNewOrder: () => void;
  onNewClient: () => void;
  onNewPayment: () => void;
  isOnline: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onNewOrder,
  onNewClient,
  onNewPayment,
  isOnline,
}) => {
  const [metrics, setMetrics] = useState<any>({
    activeOrdersCount: 0,
    urgentOrdersCount: 0,
    fittingTodayCount: 0,
    totalRemainingDue: 0,
    urgentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const remote = await api.getDashboard();
        setMetrics(remote);
      } else {
        // Compute from local IndexedDB
        const active = await db.orders
          .filter((o) => o.status !== 'DELIVERED')
          .toArray();
        const totalDue = active.reduce(
          (sum, o) => sum + (o.remainingBalance || 0),
          0,
        );

        const now = new Date();
        const next48h = new Date(now.getTime() + 48 * 3600 * 1000);

        const urgent = active.filter((o) => {
          const deadline = new Date(o.deliveryDeadline);
          return deadline <= next48h;
        });

        const todayStr = now.toISOString().split('T')[0];
        const fittingToday = active.filter(
          (o) => o.fittingDate && o.fittingDate.startsWith(todayStr),
        );

        setMetrics({
          activeOrdersCount: active.length,
          urgentOrdersCount: urgent.length,
          fittingTodayCount: fittingToday.length,
          totalRemainingDue: totalDue,
          urgentOrders: urgent.slice(0, 5),
        });
      }
    } catch (err) {
      console.warn('Dashboard fallback local:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOnline]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

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
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 pt-4">
      {/* Quick Action Bar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onNewOrder}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl shadow flex flex-col items-center justify-center gap-1.5 transition text-center active:scale-95"
        >
          <PlusCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold leading-tight">Nouvelle Commande</span>
        </button>

        <button
          onClick={onNewClient}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 p-3 rounded-2xl border border-slate-700 shadow flex flex-col items-center justify-center gap-1.5 transition text-center active:scale-95"
        >
          <Users className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold leading-tight">Ajouter Client</span>
        </button>

        <button
          onClick={onNewPayment}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 p-3 rounded-2xl border border-slate-700 shadow flex flex-col items-center justify-center gap-1.5 transition text-center active:scale-95"
        >
          <Wallet className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-bold leading-tight">Encaisser Acompte</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* En cours */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">En cours</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">
            {metrics.activeOrdersCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Commandes en atelier</p>
        </div>

        {/* Urgences (-48h) */}
        <div
          onClick={() => onNavigate('orders')}
          className={`border rounded-2xl p-4 cursor-pointer transition ${
            metrics.urgentOrdersCount > 0
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Urgences</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                metrics.urgentOrdersCount > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'
              }`}
            />
          </div>
          <div
            className={`text-2xl font-black ${
              metrics.urgentOrdersCount > 0 ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {metrics.urgentOrdersCount}
          </div>
          <p className="text-[10px] text-rose-300/80 mt-1">À livrer &lt; 48h</p>
        </div>

        {/* Essayages aujourd'hui */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Essayages</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">
            {metrics.fittingTodayCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Prévus aujourd'hui</p>
        </div>

        {/* Reliquats à encaisser */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Reliquats dus</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400 truncate">
            {formatMoney(metrics.totalRemainingDue)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">À percevoir aux livraisons</p>
        </div>
      </div>

      {/* Urgent Orders Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Délais & Urgences Proches</h3>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {metrics.urgentOrders && metrics.urgentOrders.length > 0 ? (
          <div className="space-y-2">
            {metrics.urgentOrders.map((order: any) => (
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
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {order.modelName}
                  </p>
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

      {/* Trust & WhatsApp Hint */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3">
        <div className="bg-emerald-600/20 text-emerald-400 p-2.5 rounded-xl shrink-0">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-emerald-300">
            Reçus WhatsApp instantanés & Zéro Commission
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Vos clientes reçoivent leur reçu par WhatsApp en 1 clic. 100% de vos acomptes
            vont directement dans votre poche.
          </p>
        </div>
      </div>
    </div>
  );
};
