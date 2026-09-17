import React, { useState } from 'react';
import { UserPlus, MessageCircle } from 'lucide-react';

export interface InviteEmployeeFormProps {
  onInvite: (phone: string) => Promise<void>;
  isLoading: boolean;
  inviteLink: string | null;
}

export const InviteEmployeeForm: React.FC<InviteEmployeeFormProps> = ({
  onInvite,
  isLoading,
  inviteLink,
}) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    await onInvite(phone.trim());
    setPhone('');
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Ajouter un collaborateur
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Ex: 77 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !phone.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Envoi...' : 'Inviter'}</span>
          </button>
        </div>
      </form>

      {inviteLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 animate-fadeIn">
          <p className="text-xs text-emerald-800 font-medium">
            Lien d'invitation WhatsApp prêt :
          </p>
          <a
            href={inviteLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition shadow-sm active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Envoyer sur WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
};
