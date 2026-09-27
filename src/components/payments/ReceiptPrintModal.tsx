import React from 'react';
import { useModalA11y } from '@hooks/useModalA11y';
import { X, Printer, Scissors, CheckCircle2 } from 'lucide-react';

export interface ReceiptPrintData {
  receiptNumber: string;
  amount: number;
  method?: string;
  paidAt?: string;
  clientName?: string;
  clientPhone?: string;
  modelName?: string;
  orderNumber?: string;
  totalAmount?: number;
  remainingBalance?: number;
}

export interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptPrintData | null;
  workshopName?: string;
  workshopPhone?: string;
  workshopAddress?: string;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  receipt,
  workshopName = 'Atelier Sama Waay',
  workshopPhone = '',
  workshopAddress = 'Dakar, Sénégal',
}) => {
  const { titleId, dialogProps } = useModalA11y({ isOpen: isOpen && !!receipt, onClose });

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val?: number) => {
    return new Intl.NumberFormat('fr-FR').format(val || 0) + ' FCFA';
  };

  const dateFormatted = receipt.paidAt
    ? new Date(receipt.paidAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const methodLabel = {
    CASH: 'Espèces',
    WAVE: 'Wave',
    ORANGE_MONEY: 'Orange Money',
    FREE_MONEY: 'Free Money',
  }[receipt.method || 'CASH'] || receipt.method;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Printer className="w-4 h-4 text-amber-600" />
            <span id={titleId}>Aperçu du Reçu de Caisse</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div
          id="printable-receipt"
          className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-3"
        >
          {/* Workshop Header */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-slate-950">
              <Scissors className="w-4 h-4 text-amber-600 inline" />
              <span>{workshopName.toUpperCase()}</span>
            </div>
            {workshopAddress && <p className="text-[10px] text-slate-500">{workshopAddress}</p>}
            {workshopPhone && <p className="text-[10px] text-slate-500">Tél: {workshopPhone}</p>}
          </div>

          {/* Receipt Info */}
          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Quittance N° :</span>
              <strong className="text-slate-900 font-bold">{receipt.receiptNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date :</span>
              <span>{dateFormatted}</span>
            </div>
          </div>

          {/* Client & Order details */}
          <div className="text-[11px] space-y-0.5 pt-1.5 border-t border-dashed border-slate-200">
            {receipt.clientName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente :</span>
                <span className="font-bold text-slate-900">{receipt.clientName}</span>
              </div>
            )}
            {receipt.orderNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Commande réf :</span>
                <span>#{receipt.orderNumber}</span>
              </div>
            )}
            {receipt.modelName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Modèle :</span>
                <span>{receipt.modelName}</span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="text-[11px] space-y-1 pt-2 border-t border-dashed border-slate-300">
            {receipt.totalAmount !== undefined && (
              <div className="flex justify-between text-slate-500">
                <span>Prix Total :</span>
                <span>{formatPrice(receipt.totalAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
              <span>Montant versé :</span>
              <span>{formatPrice(receipt.amount)}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Mode de règlement :</span>
              <span>{methodLabel}</span>
            </div>

            {receipt.remainingBalance !== undefined && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Reliquat restant :</span>
                <strong className={receipt.remainingBalance > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                  {receipt.remainingBalance > 0 ? formatPrice(receipt.remainingBalance) : 'Soldé ✨'}
                </strong>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
            <p className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
              <span>Merci de votre confiance !</span>
            </p>
            <p className="text-[9px] mt-0.5">Sama Waay • sama-waay.sn</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition active:scale-95"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
