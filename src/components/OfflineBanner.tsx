import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingCount,
  onSync,
  isSyncing = false,
}) => {
  // If online and no pending mutations, banner is hidden
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-2 text-xs flex items-center justify-between border-b transition-all animate-fade-in ${
        !isOnline
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {!isOnline ? (
          <div className="flex items-center gap-1.5 font-medium text-rose-800 shrink-0">
            <WifiOff className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
            <span>Mode Hors-ligne</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-medium text-amber-800 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synchronisation</span>
          </div>
        )}
        <span className="truncate text-[11px] opacity-90">
          {!isOnline
            ? 'Vos modifications sont sécurisées dans le stockage local.'
            : `${pendingCount} élément(s) en attente de synchronisation avec le serveur.`}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {pendingCount > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              !isOnline
                ? 'bg-rose-200/80 text-rose-950'
                : 'bg-amber-200/80 text-amber-950'
            }`}
          >
            {pendingCount}
          </span>
        )}

        {isOnline && onSync && pendingCount > 0 && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            type="button"
            className="text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-amber-200 hover:bg-amber-300 disabled:opacity-50 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'En cours...' : 'Synchroniser'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
