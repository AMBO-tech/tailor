import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  onClick,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700',
    danger: 'bg-rose-950/40 border-rose-800/80 text-rose-200 hover:border-rose-700',
    warning: 'bg-amber-950/40 border-amber-800/80 text-amber-200 hover:border-amber-700',
    success: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200 hover:border-emerald-700',
  };

  return (
    <div
      onClick={onClick}
      className={order rounded-2xl p-4 transition  }
    >
      <div className=flex items-center justify-between text-slate-400 mb-2>
        <span className=text-xs font-medium>{label}</span>
        {icon}
      </div>
      <div className=text-2xl font-black truncate>{value}</div>
      {subtitle && <p className=text-[10px] text-slate-400 mt-1>{subtitle}</p>}
    </div>
  );
};
