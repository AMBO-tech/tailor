import React, { useId, useState } from 'react';
import { SubscriptionTransferMethod, Workshop } from '@types';
import {
  X,
  CheckCircle2,
  Sparkles,
  Users,
  User,
  ShieldCheck,
  MessageCircle,
  Copy,
} from 'lucide-react';
import { useModalA11y } from '@hooks/useModalA11y';
import {
  DEFAULT_PUBLIC_CONFIG,
  useCurrentSubscriptionQuery,
  usePublicConfigQuery,
} from '@hooks/useSubscription';
import { formatSenegalPhoneDisplay } from '@utils/phone';
import { toast } from '@services/toast';
import { ManualPaymentSheet } from './ManualPaymentSheet';

/** Durées proposées (mois), limitées par `maxSubscriptionMonths`. */
const DURATION_CHOICES = [1, 3, 6, 12];

/** Prix des cartes de forfait, avec une espace normale comme l'affichage d'origine (« 3 000 »). */
function formatPlanPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\s/g, ' ');
}

export interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: Workshop | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  workshop,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'SOLO' | 'EQUIPE'>('SOLO');
  const [paymentMethod, setPaymentMethod] = useState<SubscriptionTransferMethod>('WAVE');
  const [months, setMonths] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const config = usePublicConfigQuery().data ?? DEFAULT_PUBLIC_CONFIG;
  const { data: current } = useCurrentSubscriptionQuery(isOpen && !!workshop);
  const durationLabelId = useId();
  const { titleId, dialogProps } = useModalA11y({ isOpen: isOpen && !!workshop, onClose });
  const paymentLabelId = useId();

  if (!isOpen || !workshop) return null;

  const currentSubscription = workshop.subscription;
  const isSuspended = currentSubscription?.status === 'SUSPENDED';

  // Tarifs et numéro de transfert fournis par l'API (`GET /public/config`).
  const planPrices = config.prices;
  const transferPhone = config.subscriptionTransferPhone;
  const transferPhoneDisplay = transferPhone
    ? formatSenegalPhoneDisplay(transferPhone.replace(/^\+?221/, ''))
    : 'Numéro indisponible';
  const durations = DURATION_CHOICES.filter((m) => m <= config.maxSubscriptionMonths);
  const totalAmount = planPrices[selectedPlan] * months;
  const pendingPayments = current?.pendingPayments ?? [];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleCopyPhone = async () => {
    if (!transferPhone) return;
    try {
      await navigator.clipboard.writeText(transferPhone.replace(/\s/g, ''));
      toast.success('Numéro copié ✨');
    } catch {
      toast.warning('Copie impossible : notez le numéro affiché.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-display font-black text-slate-900">
                Abonnement Sama Waay
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Atelier {workshop.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuspended && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Votre période d'essai ou abonnement est arrivé à échéance. Choisissez un forfait pour continuer à enregistrer vos commandes.</span>
          </div>
        )}

        {/* Plan Selector Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* SOLO Card */}
          <button
            type="button"
            onClick={() => setSelectedPlan('SOLO')}
            aria-pressed={selectedPlan === 'SOLO'}
            className={`text-left cursor-pointer rounded-2xl p-3.5 border-2 transition relative flex flex-col justify-between ${
              selectedPlan === 'SOLO'
                ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {selectedPlan === 'SOLO' && (
              <span className="absolute top-2 right-2 text-amber-600">
                <CheckCircle2 className="w-4 h-4 fill-amber-500 text-white" />
              </span>
            )}
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-900">SOLO</p>
              <p className="text-[11px] text-slate-500">1 Maître Tailleur</p>
            </div>
            <div className="mt-3">
              <p className="text-base font-display font-black text-slate-900">
                {formatPlanPrice(planPrices.SOLO)} <span className="text-[10px] font-sans font-bold text-slate-500">F/mois</span>
              </p>
            </div>
          </button>

          {/* EQUIPE Card */}
          <button
            type="button"
            onClick={() => setSelectedPlan('EQUIPE')}
            aria-pressed={selectedPlan === 'EQUIPE'}
            className={`text-left cursor-pointer rounded-2xl p-3.5 border-2 transition relative flex flex-col justify-between ${
              selectedPlan === 'EQUIPE'
                ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {selectedPlan === 'EQUIPE' && (
              <span className="absolute top-2 right-2 text-amber-600">
                <CheckCircle2 className="w-4 h-4 fill-amber-500 text-white" />
              </span>
            )}
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <Users className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-slate-900">ÉQUIPE</p>
              <p className="text-[11px] text-slate-500">Apprentis illimités</p>
            </div>
            <div className="mt-3">
              <p className="text-base font-display font-black text-slate-900">
                {formatPlanPrice(planPrices.EQUIPE)} <span className="text-[10px] font-sans font-bold text-slate-500">F/mois</span>
              </p>
            </div>
          </button>
        </div>

        {/* Features included */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 text-xs">
          <p className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
            Inclus dans votre forfait {selectedPlan} :
          </p>
          <ul className="space-y-1.5 text-slate-600 text-[11px]">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Gestion illimitée des clientes et commandes</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Carnet de mesures pour tous modèles sénégalais</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Quittances instantanées WhatsApp avec lien direct</span>
            </li>
            {selectedPlan === 'EQUIPE' && (
              <li className="flex items-center gap-1.5 text-amber-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Gestion multi-utilisateurs pour tous vos apprentis</span>
              </li>
            )}
          </ul>
        </div>

        {/* Payment Methods Instruction */}
        <div className="space-y-2">
          <span id={paymentLabelId} className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Instructions de paiement :
          </span>
          <div role="group" aria-labelledby={paymentLabelId} className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('WAVE')}
              aria-pressed={paymentMethod === 'WAVE'}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                paymentMethod === 'WAVE'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Wave</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('ORANGE_MONEY')}
              aria-pressed={paymentMethod === 'ORANGE_MONEY'}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                paymentMethod === 'ORANGE_MONEY'
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Orange Money</span>
            </button>
          </div>

          <span id={durationLabelId} className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Durée :
          </span>
          <div role="group" aria-labelledby={durationLabelId} className="flex gap-2">
            {durations.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                aria-pressed={months === m}
                className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  months === m
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{m} mois</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Numéro de transfert :</span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 text-sm">{transferPhoneDisplay}</span>
                {transferPhone && (
                  <button
                    type="button"
                    onClick={() => void handleCopyPhone()}
                    aria-label="Copier le numéro"
                    title="Copier le numéro"
                    className="p-1 text-slate-500 hover:text-amber-600 rounded-lg transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Montant exact :</span>
              <span className="font-bold text-amber-700 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Demandes « J'ai déjà payé » en attente de validation */}
        {pendingPayments.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-1.5 text-xs">
            <p className="font-bold text-[11px] text-amber-900 uppercase tracking-wider">
              Demandes en attente de validation
            </p>
            <ul className="space-y-1">
              {pendingPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-[11px] text-slate-700">
                  <span className="font-mono">{p.reference}</span>
                  <span>
                    {p.plan} · {p.months} mois · <strong>{formatPrice(p.amount)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>J'ai déjà payé</span>
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Votre atelier sera activé ou prolongé sous 15 minutes dès réception.
          </p>
        </div>
      </div>

      {isSheetOpen && (
        <ManualPaymentSheet
          workshop={workshop}
          plan={selectedPlan}
          months={months}
          amount={totalAmount}
          defaultMethod={paymentMethod}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </div>
  );
};
