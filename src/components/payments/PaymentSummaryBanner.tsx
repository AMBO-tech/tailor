import React from 'react';
import { Plus } from 'lucide-react';

export interface PaymentSummaryBannerProps {
  totalEncaisse?: number;
  totalAmount?: number;
  paymentsCount?: number;
  onNewPayment: () => void;
}

export const PaymentSummaryBanner: React.FC<PaymentSummaryBannerProps> = ({
  totalEncaisse,
  totalAmount,
  paymentsCount,
  onNewPayment,
}) => {
  const activeAmount = totalAmount !== undefined ? totalAmount : totalEncaisse || 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-slate-500 block">
          Total Encaissé
        </span>
        <div className="text-2xl font-display font-black text-slate-900 tabular-nums mt-0.5">
          {formatMoney(activeAmount)}
        </div>
        {paymentsCount !== undefined && (
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {paymentsCount} versement{paymentsCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <button
        onClick={onNewPayment}
        type="button"
        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1 text-xs font-bold transition active:scale-95 shrink-0"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Encaisser</span>
      </button>
    </div>
  );
};
