import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount }) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-amber-900/90 text-amber-100 border-b border-amber-700 px-4 py-2 text-xs flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
        )}
        <span>
          {!isOnline
            ? 'Mode hors-ligne actif. Vos actions sont sauvegardées localement.'
            : `${pendingCount} modification(s) en attente de synchronisation...`}
        </span>
      </div>
      {pendingCount > 0 && (
        <span className="bg-amber-800 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-600">
          {pendingCount} en attente
        </span>
      )}
    </div>
  );
};
