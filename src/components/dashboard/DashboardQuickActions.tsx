import React from 'react';
import { Plus, UserPlus, Wallet } from 'lucide-react';

export interface DashboardQuickActionsProps {
  onNewOrder: () => void;
  onNewClient: () => void;
  onNewPayment: () => void;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  onNewOrder,
  onNewClient,
  onNewPayment,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onNewOrder}
        type="button"
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-black p-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 text-sm"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Créer une Nouvelle Commande</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onNewClient}
          type="button"
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs shadow-2xs"
        >
          <UserPlus className="w-4 h-4 text-amber-600" />
          <span>Ajouter Cliente</span>
        </button>

        <button
          onClick={onNewPayment}
          type="button"
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-xs shadow-2xs"
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Encaisser Acompte</span>
        </button>
      </div>
    </div>
  );
};
