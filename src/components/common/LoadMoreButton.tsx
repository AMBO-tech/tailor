import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface LoadMoreButtonProps {
  /** Vrai s'il reste des éléments ; sinon rien n'est affiché. */
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * Bouton « Charger plus » en bas des listes paginées (commandes, clientes,
 * encaissements). Même style que les boutons secondaires existants
 * (fond ardoise clair, texte gras 12 px, coins arrondis).
 */
export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ hasMore, isLoading, onLoadMore }) => {
  if (!hasMore) return null;
  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={isLoading}
      className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Charger plus</span>
        </>
      )}
    </button>
  );
};
