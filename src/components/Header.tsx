import React from 'react';
import { Workshop, User } from '../types';
import { RefreshCw, Wifi, WifiOff, LogOut, ShieldCheck, Scissors } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  currentWorkshop: Workshop | null;
  workshops: Workshop[];
  onSelectWorkshop: (workshop: Workshop) => void;
  onLogout: () => void;
  isOnline: boolean;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentWorkshop,
  workshops,
  onSelectWorkshop,
  onLogout,
  isOnline,
  onSync,
  isSyncing,
}) => {
  return (
    <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-md border-b border-emerald-800">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Workshop Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-emerald-600 p-2 rounded-lg flex items-center justify-center text-white shrink-0 shadow">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5 truncate">
              <span className="text-amber-400">KOBA</span> TAILOR
              {currentWorkshop?.role === 'OWNER' ? (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                  Patron
                </span>
              ) : (
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-sky-500/30">
                  Employé
                </span>
              )}
            </h1>

            {workshops.length > 1 ? (
              <select
                value={currentWorkshop?.workshopId}
                onChange={(e) => {
                  const target = workshops.find((w) => w.workshopId === e.target.value);
                  if (target) onSelectWorkshop(target);
                }}
                className="bg-slate-800 text-xs text-slate-200 rounded px-1.5 py-0.5 mt-0.5 border border-slate-700 max-w-[180px] truncate"
              >
                {workshops.map((w) => (
                  <option key={w.workshopId} value={w.workshopId}>
                    {w.name} ({w.codePrefix})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-300 truncate">
                {currentWorkshop?.name || 'Mon Atelier'}
              </p>
            )}
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Online/Offline Badge */}
          <div
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium ${
              isOnline
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-rose-950 text-rose-300 border border-rose-700'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>

          {/* Manual Sync Button */}
          {isOnline && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700"
              title="Synchroniser maintenant"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 rounded-lg transition border border-slate-700"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
