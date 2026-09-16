import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet,
  Store,
  LucideIcon,
} from 'lucide-react';

export type TabType = 'dashboard' | 'orders' | 'clients' | 'payments' | 'settings';

interface TabItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  urgentCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  urgentCount = 0,
}) => {
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Commandes',
      icon: ShoppingBag,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'payments', label: 'Caisse', icon: Wallet },
    { id: 'settings', label: 'Atelier', icon: Store },
  ];

  return (
    <nav
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))' }}
      aria-label="Navigation principale"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass-dock rounded-2xl p-1.5 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                type="button"
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-150 min-w-[54px] active:scale-95 select-none ${
                  isActive
                    ? 'text-amber-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-amber-50 rounded-xl -z-10 animate-fade-in" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.8]'
                    }`}
                  />

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-amber-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-white">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 tracking-tight leading-none ${
                    isActive ? 'font-bold text-amber-700' : 'font-medium text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

