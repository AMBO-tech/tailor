import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuth } from '@hooks/useAuth';
import { useDashboardQuery } from '@hooks/useDashboard';
import { useSyncCacheInvalidation } from '@hooks/useOfflineSync';
import { useCurrentSubscriptionQuery } from '@hooks/useSubscription';
import { PWAInstallBanner, SubscriptionSuspendedBanner } from '@components/common';
import { SubscriptionModal } from '@components/settings';

export const AppLayout: React.FC = () => {
  const { user, currentWorkshop, workshops, selectWorkshop, logout } = useAuth();
  const { data: metrics } = useDashboardQuery();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  // Données rechargées après chaque synchronisation hors ligne.
  useSyncCacheInvalidation();
  // État réel de l'abonnement (lecture seule, jours restants) calculé par l'API.
  const { data: currentSubscription } = useCurrentSubscriptionQuery();

  const urgentCount = metrics?.urgentOrdersCount || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* PWA Mobile Install Banner */}
      <PWAInstallBanner />

      {/* Subscription Suspended Alert Banner */}
      <SubscriptionSuspendedBanner
        workshop={currentWorkshop}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        isReadOnly={currentSubscription ? Boolean(currentSubscription.subscription?.isReadOnly) : undefined}
      />

      {/* Top Header */}
      <Header
        user={user}
        currentWorkshop={currentWorkshop}
        workshops={workshops}
        onSelectWorkshop={selectWorkshop}
        onLogout={logout}
      />

      {/* Main Outlet for routed pages */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-24">
        <Outlet />
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav urgentCount={urgentCount} />

      {/* Subscription Modal when triggered from suspended banner */}
      {isSubscriptionModalOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          workshop={currentWorkshop}
        />
      )}
    </div>
  );
};
