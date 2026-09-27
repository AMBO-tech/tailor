import React, { useId, type ReactNode } from 'react';
import { AlertTriangle, Info, AlertCircle, X, Loader2 } from 'lucide-react';
import { useModalA11y } from '@hooks/useModalA11y';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  /** Contenu additionnel sous le message (ex. motif de refus). Rien n'est rendu sinon. */
  children?: ReactNode;
  /** Désactive le bouton de confirmation (ex. motif trop court). */
  confirmDisabled?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
  children,
  confirmDisabled = false,
}) => {
  // Échap désactivé pendant le traitement, comme les boutons de fermeture.
  const { titleId, dialogProps } = useModalA11y({ isOpen, onClose, closeOnEscape: !isLoading });
  const messageId = useId();

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      icon: AlertCircle,
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: AlertTriangle,
      button: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      icon: Info,
      button: 'bg-slate-900 hover:bg-slate-800 text-white',
    },
  }[variant];

  const Icon = variantStyles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        {...dialogProps}
        aria-describedby={messageId}
        className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4 animate-scale-up"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id={titleId} className="text-sm font-display font-bold text-slate-900">{title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fermer"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id={messageId} className="text-xs text-slate-600 leading-relaxed">{message}</p>

        {children}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition active:scale-95"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${variantStyles.button}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
