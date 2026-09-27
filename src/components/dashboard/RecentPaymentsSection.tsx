import React from 'react';
import { PaymentEntry } from '@types';
import { Wallet, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface RecentPaymentsSectionProps {
  payments: PaymentEntry[] | undefined;
  onViewAll?: () => void;
}

export const RecentPaymentsSection: React.FC<RecentPaymentsSectionProps> = ({
  payments = [],
  onViewAll,
}) => {
  const navigate = useNavigate();
  const handleViewAll = onViewAll || (() => navigate('/payments'));

  if (payments.length === 0) return null;

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat('fr-FR').format(Number(amount) || 0) + ' F';
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
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <h3 className="font-display font-bold text-xs">Derniers Encaissements</h3>
        </div>
        <button
          onClick={handleViewAll}
          className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
        >
          Historique
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {payments.slice(0, 3).map((pay) => (
          <button
            type="button"
            key={pay.id}
            onClick={handleViewAll}
            className="w-full text-left bg-slate-50/70 rounded-xl p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  {pay.order?.client?.fullName || 'Cliente'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {pay.receiptNumber} • {formatDate(pay.paidAt)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display font-bold text-emerald-600">
                +{formatMoney(pay.amount)}
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 uppercase">
                {pay.method === 'CASH' ? 'Espèces' : pay.method}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
