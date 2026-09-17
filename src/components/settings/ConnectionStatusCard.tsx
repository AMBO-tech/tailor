import React from 'react';
import { Server } from 'lucide-react';

export interface ConnectionStatusCardProps {
  isOnline?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  isOnline = true,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center gap-2 text-slate-800">
        <Server className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`} />
        <h3 className="font-bold text-xs">
          {isOnline ? 'Mode En Ligne Direct (REST API)' : 'Mode Hors-ligne'}
        </h3>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        {isOnline
          ? 'Toutes les commandes, clientes et encaissements sont synchronisés en temps réel sur la base centrale PostgreSQL sécurisée.'
          : 'Connexion au serveur momentanément indisponible.'}
      </p>
      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${
            isOnline ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          {isOnline ? 'API Connectée' : 'Déconnecté'}
        </span>
        <span className="text-[11px] text-slate-400">CDP Sénégal</span>
      </div>
    </div>
  );
};
