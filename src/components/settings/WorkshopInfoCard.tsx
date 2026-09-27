import React from 'react';
import { Workshop } from '@types';
import { Sparkles, Calendar } from 'lucide-react';

export interface WorkshopInfoCardProps {
  workshop: Workshop | null;
  onOpenSubscriptionModal?: () => void;
}

export const WorkshopInfoCard: React.FC<WorkshopInfoCardProps> = ({
  workshop,
  onOpenSubscriptionModal,
}) => {
  const isOwner = workshop?.role === 'OWNER';
  const sub = workshop?.subscription;

  const isExpired = sub?.currentPeriodEnd && new Date() > new Date(sub.currentPeriodEnd);
  const status = isExpired ? 'SUSPENDED' : sub?.status || 'TRIAL';

  const statusBadge = {
    TRIAL: { label: 'Essai 14j', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    ACTIVE: { label: sub?.plan === 'EQUIPE' ? 'Forfait ÉQUIPE' : 'Forfait SOLO', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    SUSPENDED: { label: 'Expiré', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
    PAST_DUE: { label: 'En retard', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
    CANCELLED: { label: 'Annulé', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  }[status] || { label: 'Standard', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workshop?.logoUrl ? (
            <img
              src={workshop.logoUrl}
              alt="Logo"
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-display font-black text-base">
              {workshop?.codePrefix || 'SW'}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {workshop?.name || 'Mon Atelier'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Atelier : <strong className="text-slate-700">{workshop?.codePrefix || 'Sama Waay'}</strong>
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {isOwner ? 'Propriétaire' : 'Employé'}
        </span>
      </div>

      {/* Subscription Status Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
          {sub?.currentPeriodEnd && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Jusqu'au {new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </span>
          )}
        </div>

        {isOwner && onOpenSubscriptionModal && (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="text-amber-700 hover:text-amber-800 font-bold text-xs flex items-center gap-1 hover:underline transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gérer l'offre</span>
          </button>
        )}
      </div>
    </div>
  );
};
