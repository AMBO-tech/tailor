import React, { useState } from 'react';
import { PaymentEntry } from '@types';
import { ArrowDownLeft, Calendar, MessageCircle, Printer } from 'lucide-react';
import { useAuth } from '@hooks';
import { ReceiptPrintModal } from './ReceiptPrintModal';

export interface PaymentCardProps {
  payment: PaymentEntry;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const { currentWorkshop, user } = useAuth();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const numericAmount = Number(payment.amount) || 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
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

  const openWhatsAppReceipt = () => {
    if (payment.whatsAppLink) {
      window.open(payment.whatsAppLink, '_blank');
      return;
    }

    const clientPhone = payment.order?.client?.phone || '';
    if (!clientPhone) return;

    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;

    const text =
      `*✨ REÇU DE PAIEMENT - ATELIER DE COUTURE*\n\n` +
      `👤 *Cliente* : ${payment.order?.client?.fullName || 'Cliente'}\n` +
      `💰 *Montant Versé* : ${formatMoney(numericAmount)}\n` +
      `💳 *Mode* : ${payment.method === 'CASH' ? 'Espèces' : payment.method}\n` +
      `🧾 *Quittance N°* : #${payment.receiptNumber}\n` +
      `👗 *Commande* : #${payment.order?.orderNumber || ''} (${payment.order?.modelName || ''})\n\n` +
      `Merci de votre confiance et à très bientôt ! 🇸🇳`;

    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-amber-700 block">
              #{payment.receiptNumber}
            </span>
            <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
              {payment.order?.client?.fullName || 'Versement atelier'}
            </h3>
            {payment.order?.modelName && (
              <p className="text-[11px] text-slate-500 font-medium">
                Pour : {payment.order.modelName} (#{payment.order.orderNumber})
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-display font-black text-emerald-600">
            +{formatMoney(numericAmount)}
          </div>
          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
            {payment.method === 'CASH' ? 'Espèces' : payment.method}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(payment.paidAt)}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPrintModal(true)}
            type="button"
            className="text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition text-[11px]"
            title="Imprimer le ticket de caisse"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span>Ticket</span>
          </button>

          {payment.order?.client?.phone && (
            <button
              onClick={openWhatsAppReceipt}
              type="button"
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition text-[11px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        workshopName={currentWorkshop?.name || 'Atelier Sama Waay'}
        workshopPhone={user?.phone || ''}
        receipt={{
          receiptNumber: payment.receiptNumber,
          amount: numericAmount,
          method: payment.method,
          paidAt: payment.paidAt,
          clientName: payment.order?.client?.fullName,
          clientPhone: payment.order?.client?.phone,
          modelName: payment.order?.modelName,
          orderNumber: payment.order?.orderNumber,
          totalAmount: payment.order?.totalAmount ? Number(payment.order.totalAmount) : undefined,
        }}
      />
    </div>
  );
};
