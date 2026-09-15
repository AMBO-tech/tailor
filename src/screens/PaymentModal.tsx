import React, { useEffect, useState } from 'react';
import { Order, PaymentEntry } from '../types';
import { db } from '../db/db';
import {
  X,
  Wallet,
  ShoppingBag,
  DollarSign,
  Save,
  MessageSquare,
  CheckCircle2,
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
        // Build local WhatsApp link
        const clientPhone = selectedOrder?.client?.phone || '';
        const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
        const intlPhone = cleanPhone.startsWith('221')
          ? cleanPhone
          : `221${cleanPhone}`;
        const msg = `*REÇU DE PAIEMENT - ATELIER DE COUTURE*\nClient: ${
          selectedOrder?.client?.fullName || 'Client'
        }\nMontant versé: ${new Intl.NumberFormat('fr-FR').format(
          Number(amount),
        )} FCFA (${method})\nCommande: #${
          selectedOrder?.orderNumber || ''
        }\nMerci de votre confiance !`;
        setSuccessReceipt({
          receiptNumber: res?.receiptNumber || 'REC-LOCAL',
          whatsAppLink: `https://wa.me/${intlPhone}?text=${encodeURIComponent(
            msg,
          )}`,
        });
      }
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'encaissement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Encaisser un Versement
              </h2>
              <p className="text-xs text-slate-400">
                Acompte ou solde avec reçu WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {successReceipt ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-100">
                Versement Enregistré !
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Quittance N°{' '}
                <span className="text-amber-400 font-bold">
                  {successReceipt.receiptNumber}
                </span>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
              Envoyez immédiatement le reçu numérique certifié au client sur WhatsApp.
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={successReceipt.whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 transition text-sm"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Envoyer le reçu WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Associated Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Commande concernée
              </label>
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                >
                  <option value="">-- Sans commande spécifique --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderNumber} - {o.client?.fullName} ({o.modelName}) - Reste:{' '}
                      {o.remainingBalance} F
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Montant perçu (FCFA) *
              </label>
              <input
                type="number"
                required
                placeholder="Ex: 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
              />
              {selectedOrder && (selectedOrder.remainingBalance || 0) > 0 && (
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(selectedOrder.remainingBalance || 0)}
                    className="text-[11px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 font-semibold"
                  >
                    Solde total : {selectedOrder.remainingBalance} F
                  </button>
                </div>
              )}
            </div>

            {/* Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                    className={`py-2 px-2 rounded-xl font-bold border transition ${
                      method === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Validation...' : 'Valider & Générer Reçu'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
