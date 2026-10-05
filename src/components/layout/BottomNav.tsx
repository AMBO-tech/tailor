import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet,
  Store,
  LucideIcon,
} from 'lucide-react';

export interface BottomNavProps {
  urgentCount?: number;
}

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ urgentCount = 0 }) => {
  const tabs: TabItem[] = [
    { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
    {
      to: '/orders',
      label: 'Commandes',
      icon: ShoppingBag,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/payments', label: 'Caisse', icon: Wallet },
    { to: '/settings', label: 'Atelier', icon: Store },
  ];

  return (
    <nav
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))' }}
      aria-label="Navigation principale"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass-dock rounded-2xl p-1.5 flex items-center justify-around shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-150 min-w-[54px] active:scale-95 select-none ${
                    isActive
                      ? 'text-amber-600 font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
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
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
