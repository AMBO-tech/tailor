import React, { useEffect, useState } from 'react';
import { toast, ToastMessage } from '@services/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      {toasts.map((t) => {
        let bg = 'bg-white/95 border-slate-200 text-slate-800';
        let icon = <Info className="w-4.5 h-4.5 text-blue-500 shrink-0" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-950/90 border-emerald-700/60 text-emerald-50 shadow-emerald-900/20';
          icon = <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-950/90 border-rose-700/60 text-rose-50 shadow-rose-900/20';
          icon = <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950/90 border-amber-700/60 text-amber-50 shadow-amber-900/20';
          icon = <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />;
        } else {
          bg = 'bg-slate-900/90 border-slate-700/60 text-slate-50 shadow-slate-950/20';
          icon = <Info className="w-4.5 h-4.5 text-sky-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 px-3.5 py-3 rounded-2xl border backdrop-blur-md shadow-lg animate-slide-in text-xs font-medium transition-all ${bg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              type="button"
              className="opacity-70 hover:opacity-100 p-0.5 rounded-lg transition"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
