import React, { useEffect, useState } from 'react';
import { Workshop, User } from '@types';
import { api } from '@services/api';
import {
  Users,
  CreditCard,
  UserPlus,
  UserX,
  MessageCircle,
  Server,
  ShieldCheck,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@services/toast';

interface SettingsScreenProps {
  workshop: Workshop | null;
  user: User | null;
  isOnline: boolean;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  workshop,
  user,
  isOnline,
  onLogout,
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [invitePhone, setInvitePhone] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const isOwner = workshop?.role === 'OWNER';

  const loadMembers = async () => {
    if (!isOwner) return;
    setLoadingMembers(true);
    try {
      const data = await api.listMembers();
      setMembers(data);
    } catch (err) {
      console.warn('Error loading members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workshop]);

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone) return;

    setInviteLoading(true);
    try {
      const res = await api.inviteEmployee({ phone: invitePhone });
      setInviteLink(res.whatsAppLink);
      setInvitePhone('');
      loadMembers();
      toast.success('Invitation générée avec succès ✨');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (memberId: string, memberName: string) => {
    try {
      await api.revokeEmployee(memberId);
      loadMembers();
      toast.success(`Accès de ${memberName} révoqué.`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la révocation');
    }
  };

  return (
    <div className="space-y-4 pb-safe max-w-md mx-auto px-4 pt-3.5">
      {/* Atelier Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
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

      {/* Profil Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
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

      {/* Mode Connexion Directe */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-slate-800">
          <Server className="w-4 h-4 text-emerald-500" />
          <h3 className="font-bold text-xs">Mode En Ligne Direct</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Toutes les créations et modifications sont directement synchronisées en temps réel sur la base de données centrale PostgreSQL.
        </p>
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            API Connectée
          </span>
          <span className="text-[11px] text-slate-400">CDP Sénégal</span>
        </div>
      </div>

      {/* Team Management */}
      {isOwner && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-slate-900">
                Équipe & Apprentis
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {members.length} membre(s)
            </span>
          </div>

          <form onSubmit={handleInviteEmployee} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono"
              />
              <button
                type="submit"
                disabled={inviteLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Inviter</span>
              </button>
            </div>
          </form>

          {inviteLink && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-emerald-800 font-medium">
                Lien WhatsApp prêt à envoyer :
              </p>
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer sur WhatsApp</span>
              </a>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {m.user?.fullName || 'Utilisateur'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {m.user?.phone}
                    </span>
                  </div>

                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRevoke(m.userId, m.user?.fullName || 'cet employé')}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px] px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        type="button"
        className="w-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Se déconnecter</span>
      </button>
    </div>
  );
};
