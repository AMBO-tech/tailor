import React from 'react';
import { Calendar, Check, CreditCard, X } from 'lucide-react';
import type { AdminSubscriptionPayment } from '@types';

export interface SubscriptionPaymentCardProps {
  payment: AdminSubscriptionPayment;
  onConfirm: (payment: AdminSubscriptionPayment) => void;
  onReject: (payment: AdminSubscriptionPayment) => void;
}

const METHOD_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
};

const STATUS_BADGES: Record<string, { label: string; bg: string }> = {
  PENDING: { label: 'En attente', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  CONFIRMED: { label: 'Validée', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Refusée', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

/** Montant formaté en FCFA. */
function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} F`;
}

/**
 * Demande « J'ai déjà payé » vue par l'administrateur, dans le style de
 * `PaymentCard` : atelier, forfait, montant, moyen, références, actions.
 */
export const SubscriptionPaymentCard: React.FC<SubscriptionPaymentCardProps> = ({ payment, onConfirm, onReject }) => {
  const badge = STATUS_BADGES[payment.status] ?? STATUS_BADGES.PENDING;
  const date = new Date(payment.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-mono text-xs font-bold text-amber-700 block">{payment.reference}</span>
            <h3 className="font-display font-bold text-sm text-slate-900 leading-snug truncate">
              {payment.workshop?.name ?? 'Atelier'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {payment.workshop?.codePrefix} · {payment.requestedBy?.fullName} ({payment.requestedBy?.phone})
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-base font-display font-black text-emerald-600">{formatMoney(payment.amount)}</div>
          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
            {METHOD_LABELS[payment.method] ?? payment.method}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className={`font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>{badge.label}</span>
        <span className="font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          {payment.plan} · {payment.months} mois
        </span>
        {payment.transactionRef && (
          <span className="font-mono px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
            Tx : {payment.transactionRef}
          </span>
        )}
      </div>
      {payment.rejectionReason && (
        <p className="text-[11px] text-rose-600">Motif : {payment.rejectionReason}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {date}
        </span>

        {payment.status === 'PENDING' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onReject(payment)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 transition active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Refuser</span>
            </button>
            <button
              type="button"
              onClick={() => onConfirm(payment)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Valider</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
