import React from 'react';
import { User } from '@types';

export interface UserProfileCardProps {
  user: User | null;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
      <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
        Mon Compte
      </h3>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Nom complet</span>
        <strong className="text-slate-900">{user?.fullName || 'Non renseigné'}</strong>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Téléphone</span>
        <strong className="text-slate-900 font-mono">{user?.phone}</strong>
      </div>
    </div>
  );
};
