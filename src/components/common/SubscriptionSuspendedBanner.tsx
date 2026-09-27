import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Workshop } from '@types';

export interface SubscriptionSuspendedBannerProps {
  workshop: Workshop | null;
  onOpenSubscriptionModal: () => void;
  /**
   * Lecture seule calculée par l'API (`GET /subscriptions/current`). Si absente,
   * repli sur l'abonnement mémorisé à la connexion (statut / date d'échéance).
   */
  isReadOnly?: boolean;
}

export const SubscriptionSuspendedBanner: React.FC<SubscriptionSuspendedBannerProps> = ({
  workshop,
  onOpenSubscriptionModal,
  isReadOnly,
}) => {
  if (!workshop) return null;

  const sub = workshop.subscription;
  const isExpired = sub?.currentPeriodEnd ? new Date() > new Date(sub.currentPeriodEnd) : false;
  const isSuspended = isReadOnly ?? (sub?.status === 'SUSPENDED' || isExpired);

  if (!isSuspended) return null;

  return (
    <div className="bg-rose-600 text-white px-3.5 py-2 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
          <span className="truncate font-medium">
            Abonnement expiré. Atelier en lecture seule.
          </span>
        </div>

        <button
          onClick={onOpenSubscriptionModal}
          type="button"
          className="bg-white text-rose-700 hover:bg-rose-50 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 flex items-center gap-1 shadow-2xs active:scale-95 transition"
        >
          <span>Renouveler</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
