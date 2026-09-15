import React, { useEffect, useState } from 'react';
import { PaymentEntry, Order } from '../types';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  MessageSquare,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface PaymentsScreenProps {
  isOnline: boolean;
  initialOrderForPayment?: Order | null;
  onClearInitialOrder?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  isOnline,
  initialOrderForPayment,
  onClearInitialOrder,
}) => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(!!initialOrderForPayment);
  const [totalEncaisse, setTotalEncaisse] = useState(0);

  const loadPayments = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const remote = await api.listPayments();
        setPayments(remote);
        const sum = remote.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        setTotalEncaisse(sum);
        for (const p of remote) {
          await db.payments.put({ ...p, isSynced: true });
        }
      } else {
        const local = await db.payments.toArray();
        setPayments(local);
        const sum = local.reduce((acc, p) => acc + (p.amount || 0), 0);
        setTotalEncaisse(sum);
      }
    } catch (err) {
      console.warn('Fallback local payments:', err);
      const local = await db.payments.toArray();
      setPayments(local);
      const sum = local.reduce((acc, p) => acc + (p.amount || 0), 0);
      setTotalEncaisse(sum);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [isOnline]);

  useEffect(() => {
    if (initialOrderForPayment) {
      setIsModalOpen(true);
    }
  }, [initialOrderForPayment]);

  const handleRecordPayment = async (paymentData: any) => {
    const workshopId = localStorage.getItem('tailor_workshop_id') || '';

    // Create local entry first
    const localEntry: PaymentEntry = {
      ...paymentData,
      workshopId,
      receiptNumber: `REC-PROV-${Math.floor(1000 + Math.random() * 9000)}`,
      paidAt: new Date().toISOString(),
      isSynced: false,
    };
    await db.payments.put(localEntry);

    // If order was linked, update local order balance
    if (paymentData.orderId) {
      const order = await db.orders.get(paymentData.orderId);
      if (order) {
        const newPaid = (order.totalPaid || 0) + paymentData.amount;
        const newRemaining = Math.max(0, (order.totalAmount || 0) - newPaid);
        await db.orders.update(paymentData.orderId, {
          totalPaid: newPaid,
          remainingBalance: newRemaining,
        });
      }
    }

    let remoteRes = null;
    if (isOnline) {
      try {
        remoteRes = await api.recordPayment(paymentData);
        await db.payments.put({
          ...localEntry,
          receiptNumber: remoteRes.receiptNumber,
          isSynced: true,
        });
      } catch (err) {
        console.warn('Queued payment mutation:', err);
        await db.pendingMutations.add({
          id: `mut_${Date.now()}_${Math.random()}`,
          type: 'RECORD_PAYMENT',
          payload: paymentData,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
      }
    } else {
      await db.pendingMutations.add({
        id: `mut_${Date.now()}_${Math.random()}`,
        type: 'RECORD_PAYMENT',
        payload: paymentData,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
    }

    loadPayments();
    return remoteRes;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
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
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Banner: Total Encaisse */}
      <div className="bg-gradient-to-tr from-slate-900 to-emerald-950/60 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs font-semibold text-emerald-400 block">
            Grand Livre des Encaissements
          </span>
          <div className="text-2xl font-black text-slate-100 mt-0.5">
            {formatMoney(totalEncaisse)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Historique certifié & immuable (0% de commission prélevée)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl shadow flex items-center gap-1.5 text-xs font-bold transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Encaisser</span>
        </button>
      </div>

      {/* Payments Ledger List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Chargement du grand livre...
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Aucun versement enregistré</p>
          <p className="text-xs text-slate-500 mt-1">
            Les acomptes et reliquats encaissés s'afficheront ici avec leurs quittances.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      #{p.receiptNumber}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-semibold">
                      {p.method}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(p.paidAt)}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-black text-emerald-400">
                  +{formatMoney(p.amount)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {p.channel === 'ORDER_DEPOSIT' ? 'Acompte' : 'Reliquat'}
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
