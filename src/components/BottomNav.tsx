import React from 'react';
import { LayoutDashboard, ShoppingBag, Users, Wallet, Settings, LucideIcon } from 'lucide-react';

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
    { id: 'orders', label: 'Commandes', icon: ShoppingBag, badge: urgentCount > 0 ? urgentCount : undefined },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'payments', label: 'Paiements', icon: Wallet },
    { id: 'settings', label: 'Atelier', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900 border-t border-slate-800 text-slate-400 fixed bottom-0 left-0 right-0 z-40 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
