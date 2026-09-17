import React from 'react';
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
  if (!activeUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
      >
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            title="Ouvrir en taille originale"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <img
          src={activeUrl}
          alt="Photo du tissu"
          className="w-full h-auto max-h-[80vh] object-contain mx-auto"
        />
      </div>
    </div>
  );
};
