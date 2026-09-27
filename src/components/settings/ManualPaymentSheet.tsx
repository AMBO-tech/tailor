import React, { useId, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useModalA11y } from '@hooks/useModalA11y';
import {
  TRANSFER_METHOD_LABELS,
  buildManualPaymentWhatsAppUrl,
  useCreateManualPaymentMutation,
} from '@hooks/useSubscription';
import type { SubscriptionPlanCode, SubscriptionTransferMethod, Workshop } from '@types';

export interface ManualPaymentSheetProps {
  workshop: Workshop;
  plan: SubscriptionPlanCode;
  months: number;
  amount: number;
  defaultMethod: SubscriptionTransferMethod;
  onClose: () => void;
}

const METHODS: SubscriptionTransferMethod[] = ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'];

/** Couleurs des pastilles de moyen de paiement (mêmes classes que la modale d'abonnement). */
const METHOD_ACTIVE_CLASSES: Record<SubscriptionTransferMethod, string> = {
  WAVE: 'border-blue-500 bg-blue-50 text-blue-800',
  ORANGE_MONEY: 'border-orange-500 bg-orange-50 text-orange-800',
  FREE_MONEY: 'border-rose-500 bg-rose-50 text-rose-800',
};

/**
 * Petite feuille « J'ai déjà payé » : moyen de transfert, ID de transaction
 * facultatif, envoi de la demande (`POST /subscriptions/manual-payments`) puis
 * ouverture de WhatsApp vers l'administrateur.
 *
 * Le `clientMutationId` est généré une seule fois à l'ouverture : une relance
 * (ou la synchronisation hors ligne) ne crée jamais de seconde demande.
 * Style repris de `ConfirmModal` et de la modale d'abonnement.
 */
export const ManualPaymentSheet: React.FC<ManualPaymentSheetProps> = ({
  workshop,
  plan,
  months,
  amount,
  defaultMethod,
  onClose,
}) => {
  const [method, setMethod] = useState<SubscriptionTransferMethod>(defaultMethod);
  const [transactionRef, setTransactionRef] = useState('');
  const [clientMutationId] = useState(() => uuidv4());
  const [sentReference, setSentReference] = useState<string | null>(null);
  const mutation = useCreateManualPaymentMutation();
  const { titleId, dialogProps } = useModalA11y({ onClose, closeOnEscape: !mutation.isPending });
  const methodLabelId = useId();
  const transactionId = useId();

  const formattedAmount = `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = transactionRef.trim() || undefined;
    try {
      const res = await mutation.mutateAsync({
        clientMutationId,
        plan,
        months,
        method,
        transactionRef: ref,
      });
      const whatsAppUrl =
        res.whatsAppUrl ||
        buildManualPaymentWhatsAppUrl({
          workshopName: workshop.name,
          codePrefix: workshop.codePrefix,
          plan,
          months,
          amount,
          method,
          reference: res.reference || undefined,
          transactionRef: ref,
        });
      window.open(whatsAppUrl, '_blank');
      setSentReference(res.reference || '');
    } catch {
      // Message déjà affiché par la mutation (409 : trop de demandes en attente, 403...).
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4 animate-scale-up"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-sm font-display font-bold text-slate-900">
              J'ai déjà payé
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {plan} · {months} mois · {formattedAmount}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            aria-label="Fermer"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentReference !== null ? (
          <div role="status" className="space-y-3 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              Demande envoyée — activation dès vérification
            </p>
            {sentReference && (
              <p className="text-xs text-slate-500 font-mono">
                Référence : <span className="text-amber-600 font-bold">{sentReference}</span>
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-xs"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <span
                id={methodLabelId}
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              >
                Moyen utilisé :
              </span>
              <div role="group" aria-labelledby={methodLabelId} className="flex gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                    className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      method === m
                        ? METHOD_ACTIVE_CLASSES[m]
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{TRANSFER_METHOD_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor={transactionId} className="block text-[11px] font-bold text-slate-700">
                ID de transaction (facultatif)
              </label>
              <input
                id={transactionId}
                type="text"
                maxLength={100}
                placeholder="Ex: WAVE-8F3K2"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span>Envoyer la demande sur WhatsApp</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
