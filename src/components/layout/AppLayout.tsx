import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuth } from '@hooks/useAuth';
import { useDashboardQuery } from '@hooks/useDashboard';

export const AppLayout: React.FC = () => {
  const { user, currentWorkshop, workshops, selectWorkshop, logout } = useAuth();
  const { data: metrics } = useDashboardQuery();

  const urgentCount = metrics?.urgentOrdersCount || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
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
    </div>
  );
};
