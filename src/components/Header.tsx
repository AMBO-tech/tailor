import React from 'react';
import { Workshop, User } from '@types';
import { RefreshCw, Scissors, ChevronDown, LogOut } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 header-safe">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Workshop Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {currentWorkshop?.logoUrl ? (
            <img
              src={currentWorkshop.logoUrl}
              alt={currentWorkshop.name}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Scissors className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          )}

          <div className="min-w-0">
            {/* Focus principal : Nom de l'Atelier en gras */}
            {workshops.length > 1 ? (
              <div className="relative inline-flex items-center max-w-[190px]">
                <select
                  value={currentWorkshop?.workshopId}
                  onChange={(e) => {
                    const target = workshops.find((w) => w.workshopId === e.target.value);
                    if (target) onSelectWorkshop(target);
                  }}
                  className="appearance-none bg-transparent text-sm font-display font-black text-slate-900 rounded pr-4 py-0 truncate focus:outline-none cursor-pointer"
                >
                  {workshops.map((w) => (
                    <option key={w.workshopId} value={w.workshopId}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
              </div>
            ) : (
              <h1 className="text-sm font-display font-black text-slate-900 truncate tracking-tight">
                {currentWorkshop?.name || 'Mon Atelier'}
              </h1>
            )}

            <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
              <span>Sama Waay</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{user?.fullName || 'Atelier'}</span>
            </p>
          </div>
        </div>

        {/* Status & Sync */}
        <div className="flex items-center gap-2">
          {/* Subtle Online / Offline dot */}
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Hors ligne
            </span>
          )}

          {isOnline && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              title="Synchroniser"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          )}

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

