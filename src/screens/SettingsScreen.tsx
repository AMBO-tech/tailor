import React, { useEffect, useState } from 'react';
import { Workshop, User } from '../types';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  Users,
  CreditCard,
  UserPlus,
  UserX,
  MessageCircle,
  Database,
  Trash2,
  ShieldCheck,
  LogOut,
  CheckCircle2,
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
      `Voulez-vous révoquer l'accès de ${memberName} ?`,
    );
    if (!confirm) return;

    try {
      await api.revokeEmployee(memberId);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la révocation');
    }
  };

  const handleClearCache = async () => {
    const confirm = window.confirm(
      'Voulez-vous réinitialiser le cache local ?',
    );
    if (!confirm) return;

    await db.clients.clear();
    await db.orders.clear();
    await db.payments.clear();
    await db.pendingMutations.clear();
    loadCacheStats();
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

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {isOwner ? 'Patron' : 'Employé'}
        </span>
      </div>

      {/* Subscription Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs">Abonnement</h3>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
            {workshop?.subscription?.status || 'Essai 14j'}
          </span>
        </div>

        <p className="text-xs text-slate-600">
          Plan :{' '}
          <strong className="text-slate-900">
            {workshop?.subscription?.plan === 'EQUIPE'
              ? 'Atelier Équipe'
              : 'Atelier Solo'}
          </strong>
        </p>
      </div>

      {/* Team Management (Owner Only) */}
      {isOwner && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-xs">Équipe ({members.length})</h3>
            </div>
          </div>

          <form onSubmit={handleInviteEmployee} className="flex gap-2">
            <input
              type="tel"
              placeholder="Numéro (ex: 77 123 45 67)"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={inviteLoading || !invitePhone}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-xl text-xs transition active:scale-95 disabled:opacity-50"
            >
              {inviteLoading ? '...' : 'Inviter'}
            </button>
          </form>

          {inviteLink && (
            <div className="bg-emerald-50 rounded-xl p-3 text-xs space-y-1.5 border border-emerald-200">
              <p className="text-emerald-800 font-medium">
                Lien WhatsApp prêt à envoyer :
              </p>
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Envoyer sur WhatsApp</span>
              </a>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">
                      {m.user?.fullName || 'Ouvrier'}
                    </span>
                    <span className="text-slate-500 block text-[11px] font-mono">
                      {m.user?.phone}
                    </span>
                  </div>

                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRevoke(m.userId, m.user?.fullName || 'cet employé')}
                      className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1"
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

      {/* Local Storage Info */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Database className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs">Données locales</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Clientes</span>
            <strong className="text-sm text-slate-900">{cacheStats.clients}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Commandes</span>
            <strong className="text-sm text-slate-900">{cacheStats.orders}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Paiements</span>
            <strong className="text-sm text-slate-900">{cacheStats.payments}</strong>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <button
            onClick={handleClearCache}
            className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le cache</span>
          </button>

          <span className="text-[11px] text-slate-400">CDP Sénégal</span>
        </div>
      </div>

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

