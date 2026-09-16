import React, { useEffect, useState } from 'react';
import { PaymentEntry, Order } from '@types';
import { api } from '@services/api';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { PaymentModal } from '@screens/PaymentModal';

import { toast } from '@services/toast';

interface PaymentsScreenProps {
  isOnline?: boolean;
  initialOrderForPayment?: Order | null;
  onClearInitialOrder?: () => void;
  onPaymentChanged?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  initialOrderForPayment,
  onClearInitialOrder,
  onPaymentChanged,
}) => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(!!initialOrderForPayment);
  const [totalEncaisse, setTotalEncaisse] = useState(0);

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat('fr-FR').format(Number(amount) || 0) + ' F';
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const remote = await api.listPayments();
      let list: PaymentEntry[] = Array.isArray(remote) ? remote : [];
      list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      setPayments(list);
      const sum = list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      setTotalEncaisse(sum);
    } catch (err: any) {
      console.warn('Erreur chargement paiements:', err);
      toast.error(err.message || 'Impossible de charger la liste des paiements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (initialOrderForPayment) {
      setIsModalOpen(true);
    }
  }, [initialOrderForPayment]);

  const handleRecordPayment = async (paymentData: any) => {
    try {
      const numericAmount = Number(paymentData.amount) || 0;
      const remoteRes = await api.recordPayment({
        ...paymentData,
        amount: numericAmount,
      });
      toast.success(`Encaissement de ${formatMoney(numericAmount)} enregistré ✨`);
      await loadPayments();
      onPaymentChanged?.();
      return remoteRes;
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement de l'encaissement");
      throw err;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 pb-safe max-w-md mx-auto px-4 pt-3.5">
      {/* Top Banner: Total Encaisse */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">
            Total Encaissé
          </span>
          <div className="text-2xl font-display font-black text-slate-900 tabular-nums mt-0.5">
            {formatMoney(totalEncaisse)}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1 text-xs font-bold transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Encaisser</span>
        </button>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs font-medium">
          Chargement...
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Aucun paiement enregistré</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Les acomptes et règlements reçus apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-slate-200 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{p.receiptNumber}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                      {p.method === 'CASH' ? 'Espèces' : p.method}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(p.paidAt)}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-display font-black text-emerald-700 tabular-nums">
                  +{formatMoney(p.amount)}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {p.channel === 'ORDER_DEPOSIT' ? 'Acompte' : 'Solde'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          initialOrder={initialOrderForPayment}
          onClose={() => {
            setIsModalOpen(false);
            if (onClearInitialOrder) onClearInitialOrder();
          }}
          onSave={handleRecordPayment}
        />
      )}
    </div>
  );
};

