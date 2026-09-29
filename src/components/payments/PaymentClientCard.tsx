import React from 'react';
import { CalendarClock, CheckCircle2, Phone, Scissors } from 'lucide-react';
import { Order } from '@types';
import { formatSenegalPhoneDisplay } from '@utils/phone';

export interface PaymentClientCardProps {
  /** Commande sur laquelle porte l'encaissement (avec sa cliente). */
  order: Order;
  /** Date de référence pour signaler une livraison en retard (injectable pour les tests). */
  today?: Date;
}

/** Nombre de millisecondes dans une journée. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Formate un montant entier en FCFA avec séparateur de milliers (« 12 500 F »).
 *
 * @param value - Montant en FCFA.
 * @returns Le montant formaté.
 */
export function formatAmount(value: number): string {
  // `\s` couvre les espaces insécables (U+00A0, U+202F) insérés par Intl en français.
  return `${new Intl.NumberFormat('fr-FR').format(value).replace(/\s/g, ' ')} F`;
}

/**
 * Affiche un numéro sénégalais au format local (« 77 123 45 67 »), indicatif 221 retiré s'il est présent.
 *
 * @param phone - Numéro brut (`771234567`, `221771234567`, `+221 77 123 45 67`…).
 * @returns Le numéro formaté pour l'affichage.
 */
export function formatClientPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('221') ? digits.slice(3) : digits;
  return formatSenegalPhoneDisplay(local);
}

/**
 * Renvoie les initiales d'un nom (deux lettres), comme sur la carte cliente.
 *
 * @param name - Nom complet.
 * @returns Initiales en majuscules.
 */
export function getClientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

/**
 * Calcule la part déjà payée d'une commande, bornée entre 0 et 100 %.
 *
 * @param total - Montant total de la commande.
 * @param paid - Montant déjà encaissé.
 * @returns Pourcentage entier.
 */
export function computePaidPercent(total: number, paid: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
}

/**
 * Libellé de la date de livraison (« Livraison le 12 oct. ») et indicateur de retard.
 *
 * @param deadline - Date de livraison prévue (ISO).
 * @param today - Date du jour.
 * @returns Libellé et statut de retard.
 */
function describeDeadline(deadline: string, today: Date): { label: string; isLate: boolean } {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return { label: 'Livraison non planifiée', isLate: false };
  const formatted = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const isLate = date.getTime() < startOfToday;
  const daysLate = Math.ceil((startOfToday - date.getTime()) / DAY_MS);
  return {
    label: isLate
      ? `Livraison prévue le ${formatted} · ${daysLate} j de retard`
      : `Livraison le ${formatted}`,
    isLate,
  };
}

/**
 * Carte de la cliente à qui l'on encaisse : identité, commande et avancement du paiement.
 *
 * @remarks
 * Reprend le langage visuel de `ClientCard` (pastille d'initiales ambrée, police `display`)
 * et met en avant le **reste à payer**, l'information décisive au moment d'encaisser.
 */
export const PaymentClientCard: React.FC<PaymentClientCardProps> = ({
  order,
  today = new Date(),
}) => {
  const clientName = order.client?.fullName || 'Cliente';
  const phone = order.client?.phone;
  const total = Number(order.totalAmount) || 0;
  const paid = Number(order.totalPaid) || 0;
  const remaining = Math.max(0, Number(order.remainingBalance ?? total - paid) || 0);
  const percent = computePaidPercent(total, paid);
  const deadline = describeDeadline(order.deliveryDeadline, today);
  const isSettled = remaining === 0;

  return (
    <section
      aria-label={`Encaissement pour ${clientName}`}
      className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white shadow-xs overflow-hidden animate-fade-in"
    >
      <div className="p-3.5 flex items-center gap-3">
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-display font-black text-sm shrink-0"
        >
          {getClientInitials(clientName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-base text-slate-900 leading-tight truncate">
            {clientName}
          </p>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-0.5 text-xs text-slate-500 font-mono inline-flex items-center gap-1 hover:text-slate-900"
            >
              <Phone className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span>{formatClientPhone(phone)}</span>
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-slate-400">Téléphone non renseigné</p>
          )}
        </div>
        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 rounded-lg px-2 py-1 shrink-0">
          #{order.orderNumber}
        </span>
      </div>

      <div className="px-3.5 pb-3 space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Scissors className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span className="truncate">{order.modelName}</span>
        </p>
        <p
          className={`flex items-center gap-1.5 font-medium ${deadline.isLate ? 'text-rose-600' : 'text-slate-500'}`}
        >
          <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{deadline.label}</span>
        </p>
      </div>

      <div className="px-3.5 pb-3.5 space-y-2">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>
            Payé <span className="font-bold text-slate-700">{formatAmount(paid)}</span>
          </span>
          <span>
            Total <span className="font-bold text-slate-700">{formatAmount(total)}</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Part déjà payée"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 rounded-full bg-slate-100 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        {isSettled ? (
          <p className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>Commande entièrement soldée</span>
          </p>
        ) : (
          <div className="flex items-end justify-between rounded-xl bg-white border border-rose-100 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Reste à payer
            </span>
            <span className="font-display font-black text-xl text-rose-600 leading-none">
              {formatAmount(remaining)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
