import React, { useEffect, useState } from 'react';
import { api } from '@services/api';
import {
  TrendingUp,
  Plus,
  UserPlus,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Wallet,
  CreditCard,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { TabType } from '@components/BottomNav';
import { OrderStatusBadge } from '@components/OrderStatusBadge';

interface DashboardScreenProps {
  onNavigate: (tab: TabType) => void;
  onNewOrder: () => void;
  onNewClient: () => void;
  onNewPayment: () => void;
  isOnline: boolean;
  dataVersion?: number;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onNewOrder,
  onNewClient,
  onNewPayment,
  isOnline,
  dataVersion = 0,
}) => {
  const [metrics, setMetrics] = useState<any>({
    activeOrdersCount: 0,
    urgentOrdersCount: 0,
    totalRemainingDue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    recentPayments: [],
    urgentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const remote = await api.getDashboard();
      if (remote) {
        setMetrics(remote);
      }
    } catch (err) {
      console.warn('Dashboard API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataVersion]);

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
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3.5">
      {/* Primary Action Button */}
      <button
        onClick={onNewOrder}
        type="button"
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 text-sm"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Nouvelle Commande</span>
      </button>

      {/* Secondary Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onNewClient}
          type="button"
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 text-xs transition active:scale-98"
        >
          <UserPlus className="w-4 h-4 text-slate-500" />
          <span>+ Nouvelle Cliente</span>
        </button>

        <button
          onClick={onNewPayment}
          type="button"
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 text-xs transition active:scale-98"
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Encaisser un Versement</span>
        </button>
      </div>

      {/* 2 Chic Financial Metric Boxes (Hebdomadaire & Mensuel) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Box 1: Semaine */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cette Semaine
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-display font-black text-emerald-700 tracking-tight">
            {formatMoney(metrics.weeklyRevenue || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Argent perçu (7j)
          </p>
        </div>

        {/* Box 2: Mois */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ce Mois-ci
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-display font-black text-slate-900 tracking-tight">
            {formatMoney(metrics.monthlyRevenue || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Total recettes mois
          </p>
        </div>
      </div>

      {/* 3 Essential Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition"
        >
          <span className="text-[11px] font-medium text-slate-500 block">En cours</span>
          <div className="text-xl font-display font-black text-slate-900 mt-1">
            {metrics.activeOrdersCount}
          </div>
        </div>

        <div
          onClick={() => onNavigate('orders')}
          className={`rounded-xl p-3 border shadow-sm cursor-pointer transition ${
            metrics.urgentOrdersCount > 0
              ? 'bg-rose-50 border-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span
            className={`text-[11px] font-medium block ${
              metrics.urgentOrdersCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'
            }`}
          >
            Urgences &lt;48h
          </span>
          <div
            className={`text-xl font-display font-black mt-1 ${
              metrics.urgentOrdersCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {metrics.urgentOrdersCount}
          </div>
        </div>

        <div
          onClick={() => onNavigate('payments')}
          className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition"
        >
          <span className="text-[11px] font-medium text-slate-500 block truncate">À percevoir</span>
          <div className="text-sm font-display font-black text-amber-700 truncate mt-1">
            {formatMoney(metrics.totalRemainingDue)}
          </div>
        </div>
      </div>

      {/* Urgent Orders Section (Strictly 2 items with prominent 'Voir tout' button) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-500" />
            <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Priorités & Échéances
            </h2>
          </div>

          {/* Prominent and clearly visible 'Voir tout' button */}
          <button
            onClick={() => onNavigate('orders')}
            type="button"
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
          >
            <span>Voir tout ({metrics.urgentOrdersCount})</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
          </button>
        </div>

        {metrics.urgentOrders && metrics.urgentOrders.length > 0 ? (
          <div className="space-y-2">
            {metrics.urgentOrders.slice(0, 2).map((order: any) => (
              <div
                key={order.id}
                onClick={() => onNavigate('orders')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 transition cursor-pointer active:scale-98"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {order.client?.fullName || 'Cliente'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{order.orderNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                    {order.modelName}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(order.deliveryDeadline)}</span>
                  </div>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="font-medium text-slate-600">Aucune commande urgente en retard</p>
          </div>
        )}
      </div>

      {/* Recent Cash Receipts Widget */}
      {metrics.recentPayments && metrics.recentPayments.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Derniers Encaissements
              </h2>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-0.5"
            >
              <span>Journal Caisse</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {metrics.recentPayments.slice(0, 2).map((p: any) => (
              <div
                key={p.id}
                onClick={() => onNavigate('payments')}
                className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {p.order?.client?.fullName || 'Client'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {p.receiptNumber} • {p.method}
                  </span>
                </div>
                <div className="font-bold text-emerald-700 text-xs">
                  +{formatMoney(Number(p.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

