import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import type { PendingMutation } from '@types';

export interface PendingSyncCardProps {
  failedMutations: PendingMutation[];
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}

const TYPE_LABELS: Record<PendingMutation['type'], string> = {
  CREATE_CLIENT: 'Nouvelle cliente',
  CREATE_ORDER: 'Nouvelle commande',
  RECORD_PAYMENT: 'Encaissement',
  UPDATE_ORDER_STATUS: 'Changement de statut',
  CREATE_SUBSCRIPTION_PAYMENT: 'Paiement d’abonnement',
};

/** Libellé lisible d'une mutation en échec (nom, modèle ou montant). */
function describe(mutation: PendingMutation): string {
  switch (mutation.type) {
    case 'CREATE_CLIENT':
      return mutation.payload.fullName;
    case 'CREATE_ORDER':
      return mutation.payload.modelName;
    case 'RECORD_PAYMENT':
      return `${new Intl.NumberFormat('fr-FR').format(mutation.payload.amount)} FCFA`;
    case 'CREATE_SUBSCRIPTION_PAYMENT':
      return `${mutation.payload.plan} · ${mutation.payload.months} mois`;
    default:
      return mutation.payload.status;
  }
}

/**
 * Éléments enregistrés hors ligne que le serveur a refusés (erreur 4xx) :
 * affichés dans les Réglages pour être relancés ou abandonnés, au lieu d'être
 * ignorés silencieusement. Reprend le style de `ConnectionStatusCard`.
 * N'affiche rien s'il n'y a aucun échec.
 */
export const PendingSyncCard: React.FC<PendingSyncCardProps> = ({
  failedMutations,
  onRetry,
  onDiscard,
}) => {
  if (failedMutations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center gap-2 text-slate-800">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-xs">
          Synchronisation à vérifier ({failedMutations.length})
        </h3>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Ces éléments enregistrés hors ligne ont été refusés par le serveur.
      </p>
      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {failedMutations.map((mutation) => (
          <li key={mutation.id} className="py-2 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">
                {TYPE_LABELS[mutation.type]} · {describe(mutation)}
              </p>
              {mutation.lastError && (
                <p className="text-[11px] text-rose-600 truncate">{mutation.lastError}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onRetry(mutation.id)}
                aria-label={`Réessayer : ${TYPE_LABELS[mutation.type]}`}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDiscard(mutation.id)}
                aria-label={`Abandonner : ${TYPE_LABELS[mutation.type]}`}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
