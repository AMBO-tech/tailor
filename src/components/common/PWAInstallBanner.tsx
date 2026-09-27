import React, { useState } from 'react';
import { usePWAInstall } from '@hooks/usePWAInstall';
import { Smartphone, Download, X, Share } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if installable on Android/Desktop or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 px-3.5 py-2.5 shadow-md flex flex-col gap-2 transition-all">
      <div className="max-w-md mx-auto w-full flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-tight leading-tight text-slate-950">
              Installer l'application Sama Waay
            </p>
            <p className="text-[11px] font-medium text-amber-950/80 truncate">
              Accès rapide plein écran sans passer par le navigateur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            type="button"
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Installer</span>
          </button>

          <button
            onClick={handleDismiss}
            type="button"
            className="p-1.5 text-amber-950/70 hover:text-amber-950 hover:bg-amber-400/50 rounded-lg transition"
            title="Ignorer"
            aria-label="Ignorer l'installation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="max-w-md mx-auto w-full bg-slate-950 text-white rounded-xl p-3 text-xs space-y-1.5 animate-fade-in border border-amber-400/40">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5" />
              <span>Sur iPhone / Safari :</span>
            </span>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              aria-label="Fermer le guide"
              className="p-[5px] -m-[5px] text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300">
            1. Appuyez sur le bouton <strong>Partager</strong> <span className="text-amber-400 font-bold">⎋</span> en bas de Safari.<br />
            2. Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong> ➕.
          </p>
        </div>
      )}
    </div>
  );
};
