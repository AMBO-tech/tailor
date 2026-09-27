import React, { useEffect, useId, useRef, useState } from 'react';
import { Order, RecordPaymentDto, RecordPaymentResponse } from '@types';
import { api } from '@services/api';
import {
  X,
  Wallet,
  Save,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  Printer,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@services/toast';
import { getErrorMessage, wasErrorNotified } from '@utils/errors';
import { logger } from '@utils/logger';
import { useAuth } from '@hooks';
import { ReceiptPrintModal, ReceiptPrintData } from './ReceiptPrintModal';
import { useModalA11y } from '@hooks/useModalA11y';

export interface PaymentModalProps {
  initialOrder?: Order | null;
  unpaidOrders?: Order[];
  preselectedOrderId?: string;
  isOpen?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (paymentData: RecordPaymentDto) => Promise<RecordPaymentResponse | void>;
  onSubmit?: (paymentData: RecordPaymentDto) => Promise<RecordPaymentResponse | void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  initialOrder,
  unpaidOrders,
  preselectedOrderId,
  isOpen = true,
  isLoading: externalLoading = false,
  onClose,
  onSave,
  onSubmit,
}) => {
  // Liste de repli, chargée seulement si l'appelant ne fournit pas `unpaidOrders`.
  const [fallbackOrders, setFallbackOrders] = useState<Order[]>([]);
  const orders = unpaidOrders ?? fallbackOrders;
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    preselectedOrderId || initialOrder?.id || '',
  );
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<'CASH' | 'WAVE' | 'ORANGE_MONEY'>('CASH');
  const [channel, setChannel] = useState<'ORDER_DEPOSIT' | 'ORDER_BALANCE'>(
    initialOrder?.totalPaid && initialOrder.totalPaid > 0
      ? 'ORDER_BALANCE'
      : 'ORDER_DEPOSIT',
  );
  const { currentWorkshop, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNumber: string;
    whatsAppLink: string;
    /** Instantané figé à l'encaissement : la liste des commandes est rechargée ensuite. */
    print: ReceiptPrintData;
  } | null>(null);
  // ARC-3 : identifiants générés une seule fois à l'ouverture du formulaire. Une
  // relance (réseau lent, double appui) réutilise les mêmes : le serveur peut
  // dédoublonner au lieu de créer un deuxième paiement.
  const [draftIds] = useState(() => ({ id: uuidv4(), clientMutationId: uuidv4() }));
  // Présélection automatique de la première commande : une seule fois, et seulement
  // si l'appelant n'a rien présélectionné.
  const hasDefaultSelectionRef = useRef(Boolean(preselectedOrderId || initialOrder));
  const { titleId, dialogProps } = useModalA11y({ isOpen, onClose });
  const fieldId = useId();

  // FE-3 : repli réseau uniquement sans liste fournie (les pages passent toujours
  // `unpaidOrders` issu du cache : plus de second chargement, PERF-2).
  const needsFallbackOrders = unpaidOrders === undefined;
  useEffect(() => {
    if (!needsFallbackOrders) return undefined;
    let cancelled = false;
    api
      .listOrders()
      .then((list) => {
        if (cancelled) return;
        const orderList: Order[] = Array.isArray(list) ? list : [];
        setFallbackOrders(
          orderList.filter(
            (o) =>
              (Number(o.remainingBalance) || 0) > 0 ||
              (o.status !== 'LIVRE' && o.status !== 'ANNULE'),
          ),
        );
      })
      .catch((err) => {
        logger.warn('Error loading orders in PaymentModal:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [needsFallbackOrders]);

  useEffect(() => {
    if (hasDefaultSelectionRef.current || orders.length === 0) return;
    hasDefaultSelectionRef.current = true;
    setSelectedOrderId((current) => current || orders[0].id);
  }, [orders]);

  if (!isOpen) return null;

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || initialOrder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.warning('Veuillez renseigner un montant valide.');
      return;
    }
    // L'API refuse désormais un versement sans commande (400) : on prévient avant l'envoi.
    if (!selectedOrderId) {
      toast.warning('Veuillez choisir la commande concernée par ce versement.');
      return;
    }

    setLoading(true);
    try {
      const payload: RecordPaymentDto = {
        id: draftIds.id,
        clientMutationId: draftIds.clientMutationId,
        orderId: selectedOrderId || undefined,
        amount: Number(amount),
        method,
        channel,
      };

      let res: RecordPaymentResponse | undefined;
      if (onSubmit) {
        res = (await onSubmit(payload)) || undefined;
      } else if (onSave) {
        res = (await onSave(payload)) || undefined;
      }

      const receiptNumber = res?.receiptNumber || (res?.whatsAppLink ? 'REC-PROV' : 'REC-LOCAL');
      const print: ReceiptPrintData = {
        receiptNumber,
        amount: Number(amount) || 0,
        method,
        paidAt: res?.paidAt || new Date().toISOString(),
        clientName: selectedOrder?.client?.fullName || 'Cliente',
        clientPhone: selectedOrder?.client?.phone,
        modelName: selectedOrder?.modelName,
        orderNumber: selectedOrder?.orderNumber,
        totalAmount: selectedOrder?.totalAmount,
        remainingBalance: selectedOrder
          ? Math.max(0, (selectedOrder.remainingBalance || 0) - Number(amount))
          : undefined,
      };

      if (res && res.whatsAppLink) {
        setSuccessReceipt({
          receiptNumber: res.receiptNumber || 'REC-PROV',
          whatsAppLink: res.whatsAppLink,
          print,
        });
      } else {
        // Build local WhatsApp receipt link
        const clientPhone = selectedOrder?.client?.phone || '';
        const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
        const internationalPhone = cleanPhone.startsWith('221')
          ? cleanPhone
          : `221${cleanPhone}`;
        const msg =
          `*✨ REÇU DE PAIEMENT - ATELIER DE COUTURE*\n\n` +
          `👤 *Cliente* : ${selectedOrder?.client?.fullName || 'Cliente'}\n` +
          `💰 *Montant Versé* : ${new Intl.NumberFormat('fr-FR').format(Number(amount))} FCFA\n` +
          `💳 *Mode* : ${method === 'CASH' ? 'Espèces' : method}\n` +
          `🧾 *Quittance N°* : #${res?.receiptNumber || 'REC-PROV'}\n` +
          `👗 *Commande* : #${selectedOrder?.orderNumber || ''} (${selectedOrder?.modelName || ''})\n\n` +
          `Merci de votre confiance et à très bientôt ! 🇸🇳`;

        setSuccessReceipt({
          receiptNumber: res?.receiptNumber || 'REC-LOCAL',
          whatsAppLink: `https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`,
          print,
        });
      }
    } catch (err: unknown) {
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, "Erreur lors de l'encaissement"));
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || externalLoading;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white border border-slate-200 w-full max-w-lg rounded-t-[1.75rem] sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm sm:text-base font-display font-bold text-slate-900">
                Encaisser un Versement
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Acompte ou solde avec reçu WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {successReceipt ? (
          <div className="p-6 text-center space-y-4 animate-fade-in bg-white">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Versement Enregistré !
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Quittance N°{' '}
                <span className="text-amber-600 font-bold">
                  {successReceipt.receiptNumber}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-200">
              Le paiement a été synchronisé directement sur le serveur et le reliquat de la commande a été recalculé.
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={successReceipt.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-sm text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer le Reçu par WhatsApp</span>
              </a>

              <button
                onClick={() => setShowPrintModal(true)}
                type="button"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-sm text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Reçu / Ticket Papier</span>
              </button>

              <button
                onClick={onClose}
                type="button"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Choose Order (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-order`} className="block text-xs font-bold text-slate-700">
                Commande associée (Optionnel)
              </label>
              <select
                id={`${fieldId}-order`}
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="">-- Versement Libre / Sans commande --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.orderNumber} - {o.client?.fullName || 'Cliente'} ({o.modelName}) [Reste: {o.remainingBalance || 0} F]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Order Summary Banner */}
            {selectedOrder && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">
                    {selectedOrder.client?.fullName || 'Cliente'}
                  </span>
                  <span className="font-mono text-amber-800 font-bold text-[11px]">
                    #{selectedOrder.orderNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex justify-between">
                  <span>Total : {selectedOrder.totalAmount} F</span>
                  <span>Déjà payé : {selectedOrder.totalPaid || 0} F</span>
                </div>
                <div className="text-right pt-1 border-t border-amber-200/50">
                  <span className="text-rose-600 font-bold text-xs">
                    Reliquat restant dû : {selectedOrder.remainingBalance || 0} F
                  </span>
                </div>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label htmlFor={`${fieldId}-amount`} className="block text-xs font-bold text-slate-700 mb-1">
                Montant versé (FCFA) *
              </label>
              <input
                id={`${fieldId}-amount`}
                type="number"
                required
                min="100"
                step="100"
                placeholder="Ex: 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />

              {/* Shortcut to fill remaining balance */}
              {selectedOrder && (selectedOrder.remainingBalance || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(selectedOrder.remainingBalance || '')}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold mt-1 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Régler tout le reliquat restant ({selectedOrder.remainingBalance} F)</span>
                </button>
              )}
            </div>

            {/* Mode de règlement */}
            <div className="space-y-1.5">
              <span id={`${fieldId}-method`} className="block text-xs font-bold text-slate-700">
                Mode de paiement
              </span>
              <div role="group" aria-labelledby={`${fieldId}-method`} className="grid grid-cols-3 gap-2">
                {[
                  { key: 'CASH', label: 'Espèces' },
                  { key: 'WAVE', label: 'Wave' },
                  { key: 'ORANGE_MONEY', label: 'Orange Money' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key as typeof method)}
                    aria-pressed={method === m.key}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
                      method === m.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel (Type) */}
            <div className="space-y-1.5">
              <span id={`${fieldId}-channel`} className="block text-xs font-bold text-slate-700">
                Type de quittance
              </span>
              <div role="group" aria-labelledby={`${fieldId}-channel`} className="grid grid-cols-2 gap-2">
                {[
                  { key: 'ORDER_DEPOSIT', label: 'Acompte initial' },
                  { key: 'ORDER_BALANCE', label: 'Règlement / Solde' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setChannel(c.key as typeof channel)}
                    aria-pressed={channel === c.key}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
                      channel === c.key
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 text-xs sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement du versement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Encaisser & Émettre le Reçu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        workshopName={currentWorkshop?.name || 'Atelier Sama Waay'}
        workshopPhone={user?.phone || ''}
        receipt={successReceipt ? successReceipt.print : null}
      />
    </div>
  );
};
