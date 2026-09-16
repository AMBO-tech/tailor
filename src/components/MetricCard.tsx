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
    default: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300',
    danger: 'bg-rose-50/50 border-rose-200 text-rose-950 hover:border-rose-300',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950 hover:border-amber-300',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:border-emerald-300',
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-4 transition shadow-xs ${onClick ? 'cursor-pointer active:scale-98' : ''} ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold truncate">{value}</div>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};
