import React from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { generateWhatsAppReceiptUrl } from '../utils/whatsapp';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  phone: string;
  amount: number;
  receiptNumber: string;
  orderNumber?: string;
  modelName?: string;
  remainingBalance?: number;
  workshopName: string;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  clientName,
  phone,
  amount,
  receiptNumber,
  orderNumber,
  modelName,
  remainingBalance,
  workshopName,
}) => {
  if (!isOpen) return null;

  const waUrl = generateWhatsAppReceiptUrl({
    phone,
    clientName,
    amount,
    receiptNumber,
    orderNumber,
    modelName,
    remainingBalance,
    workshopName,
  });

  return (
    <div className=fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4>
      <div className=bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl>
        <div className=flex items-center justify-between border-b border-slate-800 pb-3>
          <div className=flex items-center gap-2>
            <CheckCircle2 className=w-5 h-5 text-emerald-400 />
            <h3 className=font-bold text-sm text-slate-100>Reçu d'encaissement</h3>
          </div>
          <button onClick={onClose} className=text-slate-400 hover:text-white>
            <X className=w-4 h-4 />
          </button>
        </div>

        <div className=bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300>
          <div className=text-amber-400 font-bold>{workshopName.toUpperCase()}</div>
          <div>Client: {clientName}</div>
          <div>Montant: {new Intl.NumberFormat('fr-FR').format(amount)} FCFA</div>
          <div>Reçu N°: {receiptNumber}</div>
          {orderNumber && <div>Commande: #{orderNumber}</div>}
        </div>

        <div className=flex gap-2>
          <button
            onClick={onClose}
            className=flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition
          >
            Fermer
          </button>
          <a
            href={waUrl}
            target=_blank
            rel=noopener noreferrer
            className=flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition
          >
            <Send className=w-3.5 h-3.5 />
            <span>Envoyer WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
