import React from 'react';
import { Workshop } from '@types';

export interface WorkshopInfoCardProps {
  workshop: Workshop | null;
}

export const WorkshopInfoCard: React.FC<WorkshopInfoCardProps> = ({ workshop }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
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
        {workshop?.role === 'OWNER' ? 'Propriétaire' : 'Employé'}
      </span>
    </div>
  );
};
