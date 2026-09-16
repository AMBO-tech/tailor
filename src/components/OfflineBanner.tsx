import React from 'react';
import { WifiOff, CloudUpload } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount }) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 text-amber-900 border-b border-amber-200 px-4 py-2 text-xs flex items-center justify-between animate-fade-in"
    >
      <div className="flex items-center gap-2 min-w-0">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <CloudUpload className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
        )}
        <span className="truncate text-xs font-medium text-amber-800">
          {!isOnline
            ? 'Mode Hors-ligne : vos actions sont sauvegardées localement.'
            : `${pendingCount} modification(s) en attente de synchronisation...`}
        </span>
      </div>

      {pendingCount > 0 && (
        <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2">
          {pendingCount}
        </span>
      )}
    </div>
  );
};

