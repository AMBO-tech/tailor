import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { logger } from '@utils/logger';

/**
 * Enregistre le service worker (vite-plugin-pwa, `registerType: 'prompt'`) et,
 * quand une nouvelle version de l'application a été téléchargée, propose de
 * l'activer : « Nouvelle version disponible — Mettre à jour ».
 *
 * Reprend exactement les classes de `PWAInstallBanner` pour rester dans le
 * style des bannières existantes. N'affiche rien tant qu'aucune mise à jour
 * n'est en attente.
 */
export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      logger.warn('SW registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 px-3.5 py-2.5 shadow-md flex flex-col gap-2 transition-all"
    >
      <div className="max-w-md mx-auto w-full flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-tight leading-tight text-slate-950">
              Nouvelle version disponible
            </p>
            <p className="text-[11px] font-medium text-amber-950/80 truncate">
              Mettez à jour pour profiter des dernières améliorations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => void updateServiceWorker(true)}
            type="button"
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Mettre à jour</span>
          </button>

          <button
            onClick={() => setNeedRefresh(false)}
            type="button"
            className="p-1.5 text-amber-950/70 hover:text-amber-950 hover:bg-amber-400/50 rounded-lg transition"
            title="Plus tard"
            aria-label="Mettre à jour plus tard"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
