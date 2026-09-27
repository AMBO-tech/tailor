import React, { useId, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Clock, LogOut, ShieldCheck, Store, AlertTriangle, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal, EmptyState, LoadingSpinner, StatCard } from '@components/common';
import { ClientSearchInput } from '@components/clients/ClientSearchInput';
import { SubscriptionPaymentCard } from '@components/admin/SubscriptionPaymentCard';
import { AdminWorkshopCard, adminWorkshopStatus } from '@components/admin/AdminWorkshopCard';
import {
  ADMIN_QUERY_KEYS,
  useActivateSubscriptionMutation,
  useAdminSubscriptionPaymentsQuery,
  useAdminWorkshopsQuery,
  useConfirmSubscriptionPaymentMutation,
  useRejectSubscriptionPaymentMutation,
} from '@hooks/useAdmin';
import { clearAdminSession, getAdminUser, hasAdminSession } from '@utils/adminSession';
import type { AdminSubscriptionPayment, AdminWorkshop, SubscriptionPaymentStatus, SubscriptionPlanCode } from '@types';

type Tab = 'PAYMENTS' | 'WORKSHOPS';

const PAYMENT_FILTERS: { key: SubscriptionPaymentStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Validées' },
  { key: 'REJECTED', label: 'Refusées' },
  { key: 'ALL', label: 'Toutes' },
];

const ACTIVATION_MONTHS = [1, 3, 6, 12];

/** Longueurs acceptées par l'API pour un motif de refus. */
const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

/** Classes des pastilles de filtre (reprises de `OrderStatusFilter`). */
function pillClass(isActive: boolean): string {
  return `px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
    isActive
      ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-xs'
      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
  }`;
}

/**
 * Back-office super-administrateur : demandes « J'ai déjà payé » (valider /
 * refuser avec motif) et ateliers (recherche, statut, activation manuelle).
 * Compose les composants existants : `StatCard`, cartes, `ConfirmModal`,
 * champ de recherche et pastilles de filtre.
 */
export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('PAYMENTS');
  const [paymentFilter, setPaymentFilter] = useState<SubscriptionPaymentStatus | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [toConfirm, setToConfirm] = useState<AdminSubscriptionPayment | null>(null);
  const [toReject, setToReject] = useState<AdminSubscriptionPayment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toActivate, setToActivate] = useState<AdminWorkshop | null>(null);
  const [activationPlan, setActivationPlan] = useState<SubscriptionPlanCode>('SOLO');
  const [activationMonths, setActivationMonths] = useState(1);
  const [activationReference, setActivationReference] = useState('');
  const reasonId = useId();
  const referenceId = useId();

  const isAdmin = hasAdminSession();
  const paymentsQuery = useAdminSubscriptionPaymentsQuery(paymentFilter === 'ALL' ? undefined : paymentFilter);
  const pendingQuery = useAdminSubscriptionPaymentsQuery('PENDING');
  const workshopsQuery = useAdminWorkshopsQuery();
  const confirmMutation = useConfirmSubscriptionPaymentMutation();
  const rejectMutation = useRejectSubscriptionPaymentMutation();
  const activateMutation = useActivateSubscriptionMutation();

  const workshops = useMemo(() => workshopsQuery.data ?? [], [workshopsQuery.data]);
  const filteredWorkshops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workshops;
    return workshops.filter((w) =>
      [w.name, w.codePrefix, w.members?.[0]?.user?.fullName, w.members?.[0]?.user?.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [workshops, search]);

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const admin = getAdminUser();
  const suspendedCount = workshops.filter((w) => adminWorkshopStatus(w) === 'SUSPENDED').length;
  const trialCount = workshops.filter((w) => adminWorkshopStatus(w) === 'TRIAL').length;

  const handleLogout = () => {
    clearAdminSession();
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_KEYS.all });
    navigate('/admin/login', { replace: true });
  };

  const handleConfirm = async () => {
    if (!toConfirm) return;
    try {
      await confirmMutation.mutateAsync({ id: toConfirm.id, transactionRef: toConfirm.transactionRef ?? undefined });
      setToConfirm(null);
    } catch {
      // Message affiché par la mutation.
    }
  };

  const handleReject = async () => {
    if (!toReject) return;
    try {
      await rejectMutation.mutateAsync({ id: toReject.id, reason: rejectReason.trim() });
      setToReject(null);
      setRejectReason('');
    } catch {
      // Message affiché par la mutation.
    }
  };

  const handleActivate = async () => {
    if (!toActivate) return;
    try {
      await activateMutation.mutateAsync({
        workshopId: toActivate.id,
        plan: activationPlan,
        durationMonths: activationMonths,
        paymentReference: activationReference.trim(),
      });
      setToActivate(null);
      setActivationReference('');
    } catch {
      // Message affiché par la mutation.
    }
  };

  const formatMoney = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  const payments = paymentsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* En-tête simple (style du Header de l'atelier) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 header-safe">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-display font-black text-slate-900 truncate tracking-tight">Back-office</h1>
              <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <span>Sama Waay</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">{admin?.fullName || 'Administrateur'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-10 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Demandes en attente"
            value={pendingQuery.data?.length ?? 0}
            icon={Clock}
            variant="amber"
            subText="« J'ai déjà payé »"
            onClick={() => {
              setTab('PAYMENTS');
              setPaymentFilter('PENDING');
            }}
          />
          <StatCard
            label="Ateliers"
            value={workshops.length}
            icon={Store}
            variant="slate"
            subText={`${trialCount} en essai`}
            onClick={() => setTab('WORKSHOPS')}
          />
          <StatCard label="Abonnements expirés" value={suspendedCount} icon={AlertTriangle} variant="rose" subText="Lecture seule" />
          <StatCard
            label="Actifs ou en essai"
            value={workshops.length - suspendedCount}
            icon={Sparkles}
            variant="emerald"
            subText="Accès complet"
          />
        </div>

        {/* Onglets (style du sélecteur de LoginPage) */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex" role="tablist" aria-label="Sections du back-office">
          {(
            [
              { key: 'PAYMENTS', label: 'Demandes' },
              { key: 'WORKSHOPS', label: 'Ateliers' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'PAYMENTS' ? (
          <section className="space-y-3" aria-label="Demandes de paiement d'abonnement">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs" role="group" aria-label="Filtrer par statut">
              {PAYMENT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={paymentFilter === f.key}
                  onClick={() => setPaymentFilter(f.key)}
                  className={pillClass(paymentFilter === f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {paymentsQuery.isLoading ? (
              <LoadingSpinner label="Chargement des demandes..." />
            ) : payments.length === 0 ? (
              <EmptyState icon={Clock} title="Aucune demande" description="Aucune demande « J'ai déjà payé » pour ce filtre." />
            ) : (
              payments.map((p) => (
                <SubscriptionPaymentCard key={p.id} payment={p} onConfirm={setToConfirm} onReject={setToReject} />
              ))
            )}
          </section>
        ) : (
          <section className="space-y-3" aria-label="Ateliers">
            <ClientSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un atelier, un code ou un téléphone..."
            />
            {workshopsQuery.isLoading ? (
              <LoadingSpinner label="Chargement des ateliers..." />
            ) : filteredWorkshops.length === 0 ? (
              <EmptyState icon={Store} title="Aucun atelier trouvé" description="Modifiez votre recherche." />
            ) : (
              filteredWorkshops.map((w) => <AdminWorkshopCard key={w.id} workshop={w} onActivate={setToActivate} />)
            )}
          </section>
        )}
      </main>

      <ConfirmModal
        isOpen={Boolean(toConfirm)}
        variant="info"
        title="Valider ce paiement ?"
        message={
          toConfirm
            ? `${toConfirm.workshop?.name} · ${toConfirm.plan} ${toConfirm.months} mois · ${formatMoney(toConfirm.amount)}. L'abonnement sera prolongé.`
            : ''
        }
        confirmLabel="Valider"
        isLoading={confirmMutation.isPending}
        onConfirm={handleConfirm}
        onClose={() => setToConfirm(null)}
      />

      <ConfirmModal
        isOpen={Boolean(toReject)}
        variant="danger"
        title="Refuser ce paiement ?"
        message={toReject ? `Demande ${toReject.reference} de ${toReject.workshop?.name}. Le motif sera communiqué à l'atelier.` : ''}
        confirmLabel="Refuser"
        isLoading={rejectMutation.isPending}
        confirmDisabled={rejectReason.trim().length < REASON_MIN_LENGTH}
        onConfirm={handleReject}
        onClose={() => {
          setToReject(null);
          setRejectReason('');
        }}
      >
        <div className="space-y-1">
          <label htmlFor={reasonId} className="block text-[11px] font-bold text-slate-700">
            Motif du refus
          </label>
          <textarea
            id={reasonId}
            rows={2}
            maxLength={REASON_MAX_LENGTH}
            placeholder="Ex: Aucun transfert reçu avec cette référence"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 transition"
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(toActivate)}
        variant="warning"
        title="Activer l'abonnement"
        message={toActivate ? `Atelier ${toActivate.name} (${toActivate.codePrefix}).` : ''}
        confirmLabel="Activer"
        isLoading={activateMutation.isPending}
        confirmDisabled={!activationReference.trim()}
        onConfirm={handleActivate}
        onClose={() => setToActivate(null)}
      >
        <div className="space-y-2 text-xs">
          <div className="flex gap-2" role="group" aria-label="Forfait">
            {(['SOLO', 'EQUIPE'] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                aria-pressed={activationPlan === plan}
                onClick={() => setActivationPlan(plan)}
                className={`flex-1 ${pillClass(activationPlan === plan)}`}
              >
                {plan === 'SOLO' ? 'SOLO' : 'ÉQUIPE'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Durée">
            {ACTIVATION_MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={activationMonths === m}
                onClick={() => setActivationMonths(m)}
                className={`flex-1 ${pillClass(activationMonths === m)}`}
              >
                {m} mois
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <label htmlFor={referenceId} className="block text-[11px] font-bold text-slate-700">
              Référence du paiement
            </label>
            <input
              id={referenceId}
              type="text"
              placeholder="Ex: WAVE-123456"
              value={activationReference}
              onChange={(e) => setActivationReference(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono transition-colors"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};
