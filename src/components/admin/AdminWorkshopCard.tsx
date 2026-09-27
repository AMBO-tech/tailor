import React from 'react';
import { Sparkles, Store } from 'lucide-react';
import type { AdminWorkshop } from '@types';

export interface AdminWorkshopCardProps {
  workshop: AdminWorkshop;
  onActivate: (workshop: AdminWorkshop) => void;
}

/** Statut affiché d'un abonnement (échu = expiré), mêmes badges que `WorkshopInfoCard`. */
export function adminWorkshopStatus(workshop: AdminWorkshop): 'TRIAL' | 'ACTIVE' | 'SUSPENDED' {
  const sub = workshop.subscription;
  if (!sub) return 'SUSPENDED';
  const isExpired = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() < Date.now() : false;
  if (isExpired || sub.status === 'SUSPENDED') return 'SUSPENDED';
  return sub.status === 'ACTIVE' ? 'ACTIVE' : 'TRIAL';
}

const STATUS_BADGES = {
  TRIAL: { label: 'Essai', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ACTIVE: { label: 'Actif', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  SUSPENDED: { label: 'Expiré', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

/**
 * Atelier de la plateforme (back-office) : propriétaire, forfait, statut,
 * volumes et bouton d'activation manuelle. Style de `WorkshopInfoCard`.
 */
export const AdminWorkshopCard: React.FC<AdminWorkshopCardProps> = ({ workshop, onActivate }) => {
  const status = adminWorkshopStatus(workshop);
  const badge = STATUS_BADGES[status];
  const owner = workshop.members?.[0]?.user;
  const endDate = workshop.subscription?.currentPeriodEnd
    ? new Date(workshop.subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm text-slate-900 truncate">{workshop.name}</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {workshop.codePrefix}
              {owner ? ` · ${owner.fullName} (${owner.phone})` : ''}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>{badge.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <span className="block font-display font-black text-slate-900 text-sm">{workshop._count?.clients ?? 0}</span>
          <span className="text-slate-500">Clientes</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <span className="block font-display font-black text-slate-900 text-sm">{workshop._count?.orders ?? 0}</span>
          <span className="text-slate-500">Commandes</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <span className="block font-display font-black text-slate-900 text-sm">{workshop._count?.members ?? 0}</span>
          <span className="text-slate-500">Membres</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span>
          {workshop.subscription?.plan ?? 'SOLO'}
          {endDate ? ` · jusqu'au ${endDate}` : ''}
        </span>
        <button
          type="button"
          onClick={() => onActivate(workshop)}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 shadow-sm transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Activer</span>
        </button>
      </div>
    </div>
  );
};
