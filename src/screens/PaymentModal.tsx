import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { db } from '../db/db';
import {
  X,
  Wallet,
  ShoppingBag,
  Save,
  MessageCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PaymentModalProps {
  initialOrder?: Order | null;
  onClose: () => void;
  onSave: (paymentData: any) => Promise<any>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  initialOrder,
  onClose,
  onSave,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrder?.id || '',
  );
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<'CASH' | 'WAVE' | 'ORANGE_MONEY'>('CASH');
  const [channel, setChannel] = useState<'ORDER_DEPOSIT' | 'ORDER_BALANCE'>(
    initialOrder?.totalPaid && initialOrder.totalPaid > 0
      ? 'ORDER_BALANCE'
      : 'ORDER_DEPOSIT',
  );
  const [loading, setLoading] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNumber: string;
    whatsAppLink: string;
  } | null>(null);

  useEffect(() => {
    db.orders
      .filter((o) => (o.remainingBalance || 0) > 0)
      .toArray()
      .then((list) => {
        setOrders(list);
        if (!selectedOrderId && list.length > 0 && !initialOrder) {
          setSelectedOrderId(list[0].id);
        }
      });
  }, []);

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || initialOrder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Veuillez renseigner un montant valide.');
      return;
    }

    setLoading(true);
    try {
      const clientMutationId = uuidv4();
      const res = await onSave({
        id: uuidv4(),
        clientMutationId,
        orderId: selectedOrderId || undefined,
        amount: Number(amount),
        method,
        channel,
      });

      if (res && res.whatsAppLink) {
        setSuccessReceipt({
          receiptNumber: res.receiptNumber || 'REC-PROV',
          whatsAppLink: res.whatsAppLink,
        });
      } else {
        // Build local WhatsApp receipt link
        const clientPhone = selectedOrder?.client?.phone || '';
        const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
        const intlPhone = cleanPhone.startsWith('221')
          ? cleanPhone
          : `221${cleanPhone}`;
        const msg = `*✨ REÇU DE PAIEMENT - ATELIER DE COUTURE*\n\n` +
          `👤 *Cliente* : ${selectedOrder?.client?.fullName || 'Cliente'}\n` +
          `💰 *Montant Versé* : ${new Intl.NumberFormat('fr-FR').format(Number(amount))} FCFA\n` +
          `💳 *Mode* : ${method === 'CASH' ? 'Espèces' : method}\n` +
          `🧾 *Quittance N°* : #${res?.receiptNumber || 'REC-PROV'}\n` +
          `👗 *Commande* : #${selectedOrder?.orderNumber || ''} (${selectedOrder?.modelName || ''})\n\n` +
          `Merci de votre confiance et à très bientôt ! 🇸🇳`;

        setSuccessReceipt({
          receiptNumber: res?.receiptNumber || 'REC-LOCAL',
          whatsAppLink: `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`,
        });
      }
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'encaissement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-t-[1.75rem] sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-display font-bold text-slate-900">
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
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {successReceipt ? (
          <div className="p-6 text-center space-y-4 animate-fade-in bg-white">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
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
              Envoyez immédiatement le reçu au client via WhatsApp.
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={successReceipt.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer Reçu WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition active:scale-98 border border-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-white">
            {/* Associated Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Commande concernée
              </label>
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 transition"
                >
                  <option value="">-- Sans commande spécifique --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderNumber} - {o.client?.fullName} ({o.modelName}) - Reste: {o.remainingBalance} F
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Montant perçu (FCFA) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="Ex: 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-amber-300 rounded-xl px-3.5 py-3 text-base font-display font-bold text-slate-900 tabular-nums focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />

              {selectedOrder && (selectedOrder.remainingBalance || 0) > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setAmount(selectedOrder.remainingBalance || 0)}
                    className="text-[11px] bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-200 font-semibold active:scale-95 transition"
                  >
                    Régler le solde : {new Intl.NumberFormat('fr-FR').format(selectedOrder.remainingBalance || 0)} FCFA
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Moyen de paiement
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(
                  [
                    { id: 'CASH', label: 'Espèces' },
                    { id: 'WAVE', label: 'Wave' },
                    { id: 'ORANGE_MONEY', label: 'Orange M.' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`py-2.5 px-2 rounded-xl font-bold border transition-all active:scale-95 text-center ${
                      method === m.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky Submit Button */}
            <div className="pt-2 sticky bottom-0 bg-white modal-sheet-safe">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 text-xs"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? 'Validation...' : 'Valider & Générer Quittance'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

