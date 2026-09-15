import React, { useEffect, useState } from 'react';
import { Workshop, User } from '../types';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  CreditCard,
  UserX,
  MessageSquare,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

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
  const [cacheStats, setCacheStats] = useState({ clients: 0, orders: 0, payments: 0 });

  const isOwner = workshop?.role === 'OWNER';

  const loadMembers = async () => {
    if (!isOwner || !isOnline) return;
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

  const loadCacheStats = async () => {
    const clientsCount = await db.clients.count();
    const ordersCount = await db.orders.count();
    const paymentsCount = await db.payments.count();
    setCacheStats({
      clients: clientsCount,
      orders: ordersCount,
      payments: paymentsCount,
    });
  };

  useEffect(() => {
    loadMembers();
    loadCacheStats();
  }, [workshop, isOnline]);

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone) return;

    setInviteLoading(true);
    try {
      const res = await api.inviteEmployee({ phone: invitePhone });
      setInviteLink(res.whatsAppLink);
      setInvitePhone('');
      loadMembers();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (memberId: string, memberName: string) => {
    const confirm = window.confirm(
      `⚠️ Protocole d'Urgence :\nVoulez-vous révoquer immédiatement l'accès de ${memberName} ?\nSes tokens seront invalidés sur-le-champ.`,
    );
    if (!confirm) return;

    try {
      await api.revokeEmployee(memberId);
      alert(`Accès de ${memberName} révoqué avec succès.`);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la révocation');
    }
  };

  const handleClearCache = async () => {
    const confirm = window.confirm(
      'Voulez-vous vider le cache local ? Vos données synchronisées sur le serveur resteront intactes.',
    );
    if (!confirm) return;

    await db.clients.clear();
    await db.orders.clear();
    await db.payments.clear();
    await db.pendingMutations.clear();
    loadCacheStats();
    alert('Cache local réinitialisé.');
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 pt-4">
      {/* Workshop Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              {workshop?.codePrefix || 'AT'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {workshop?.name || 'Mon Atelier'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Code atelier : <strong className="text-amber-400">{workshop?.codePrefix}</strong>
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isOwner
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-sky-950 text-sky-300 border-sky-800'
            }`}
          >
            {isOwner ? 'Maître / Propriétaire' : 'Employé / Ouvrier'}
          </span>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">Abonnement Atelier</h3>
          </div>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {workshop?.subscription?.status || 'TRIAL (14j)'}
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <p>
            Formule actuelle :{' '}
            <strong className="text-slate-100">
              {workshop?.subscription?.plan === 'EQUIPE'
                ? 'Atelier Équipe (5 000 FCFA/mois)'
                : 'Atelier Solo (3 000 FCFA/mois)'}
            </strong>
          </p>
          <p className="text-slate-400 text-[11px]">
            Zéro commission prélevée sur vos clients. Frais de transfert Wave/OM absorbés.
          </p>
        </div>
      </div>

      {/* Team Management (Owner Only) */}
      {isOwner && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Équipe & Ouvriers de l'Atelier
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {members.length} membre(s)
            </span>
          </div>

          {/* Invite Employee Form */}
          <form onSubmit={handleInviteEmployee} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Inviter un employé par WhatsApp (Lien valable 48h)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
              />
              <button
                type="submit"
                disabled={inviteLoading || !invitePhone}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{inviteLoading ? 'Génération...' : 'Inviter'}</span>
              </button>
            </div>
          </form>

          {/* Invite Deep Link Popup */}
          {inviteLink && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs space-y-2">
              <p className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Lien d'invitation généré !
              </p>
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Envoyer sur WhatsApp
              </a>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {loadingMembers ? (
              <p className="text-xs text-slate-500">Chargement des membres...</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Aucun employé dans l'équipe pour le moment.
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200">
                      {m.user?.fullName || 'Employé'}
                    </span>
                    <span className="text-slate-500 block text-[11px] font-mono">
                      {m.user?.phone} ({m.role})
                    </span>
                  </div>

                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRevoke(m.userId, m.user?.fullName || 'cet employé')}
                      className="bg-rose-950/50 hover:bg-rose-900 border border-rose-800/80 text-rose-300 px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                      title="Révocation immédiate d'urgence"
                    >
                      <UserX className="w-3.5 h-3.5" /> Révoquer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Offline Storage & CDP Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Database className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-100">Stockage Local & Données</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Clients</span>
            <strong className="text-sm text-slate-100">{cacheStats.clients}</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Commandes</span>
            <strong className="text-sm text-slate-100">{cacheStats.orders}</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Paiements</span>
            <strong className="text-sm text-slate-100">{cacheStats.payments}</strong>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleClearCache}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vider le cache local
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>CDP Sénégal (Loi 2008-12)</span>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-200 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow"
        >
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
