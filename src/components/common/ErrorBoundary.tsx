import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@utils/logger';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Filet de sécurité React (M-24) : une erreur de rendu n'affiche plus une page
 * blanche mais un écran de secours permettant de recharger l'application.
 *
 * Composant classe : React ne fournit pas encore d'équivalent sous forme de hook.
 * L'écran reprend la mise en page de la page 404 existante.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    logger.error('Erreur de rendu non gérée :', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-sm mx-auto"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-xl font-display font-black text-slate-900 mb-1">
          Une erreur est survenue
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          L'application a rencontré un problème inattendu. Vos données enregistrées ne sont
          pas perdues.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Recharger l'application</span>
        </button>
      </div>
    );
  }
}
