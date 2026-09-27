import React from 'react';
import { useModalA11y } from '@hooks/useModalA11y';
import { X, Download } from 'lucide-react';

export interface OrderFabricPreviewModalProps {
  photoUrl?: string | null;
  imageUrl?: string | null;
  onClose: () => void;
}

export const OrderFabricPreviewModal: React.FC<OrderFabricPreviewModalProps> = ({
  photoUrl,
  imageUrl,
  onClose,
}) => {
  const activeUrl = photoUrl || imageUrl || null;
  const { dialogProps } = useModalA11y({ isOpen: !!activeUrl, onClose });
  if (!activeUrl) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        // Fermeture uniquement par un clic sur le fond (même comportement que
        // l'ancien stopPropagation sur le panneau).
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        {...dialogProps}
        aria-labelledby={undefined}
        aria-label="Photo du tissu"
        className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
      >
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            title="Ouvrir en taille originale"
            aria-label="Ouvrir la photo en taille originale"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <img
          src={activeUrl}
          alt="Tissu de la commande"
          className="w-full h-auto max-h-[80vh] object-contain mx-auto"
        />
      </div>
    </div>
  );
};
