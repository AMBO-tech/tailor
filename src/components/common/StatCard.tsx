import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'amber' | 'emerald' | 'slate' | 'rose';
  subText?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'slate',
  subText,
  onClick,
}) => {
  const variantStyles = {
    amber: {
      bg: 'bg-amber-500 text-slate-950',
      iconBg: 'bg-black/10 text-slate-950',
      labelColor: 'text-slate-900 font-bold',
      subColor: 'text-slate-900/80',
    },
    emerald: {
      bg: 'bg-white border-slate-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      labelColor: 'text-slate-500 font-medium',
      subColor: 'text-emerald-600 font-semibold',
    },
    slate: {
      bg: 'bg-white border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      labelColor: 'text-slate-500 font-medium',
      subColor: 'text-slate-400',
    },
    rose: {
      bg: 'bg-white border-slate-200',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      labelColor: 'text-slate-500 font-medium',
      subColor: 'text-rose-600 font-semibold',
    },
  };

  const style = variantStyles[variant];
  // Carte cliquable = vrai bouton (clavier + lecteur d'écran) ; sinon simple bloc.
  // `flex flex-col w-full text-left` reproduisent le rendu du bloc : par défaut un
  // bouton centre son contenu (horizontalement et verticalement) et s'ajuste à sa largeur.
  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`rounded-2xl p-4 border transition ${style.bg} ${
        onClick ? 'flex flex-col w-full text-left cursor-pointer hover:shadow-md active:scale-98' : 'shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${style.labelColor}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${style.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-display font-black tracking-tight text-slate-900">
        {value}
      </div>
      {subText && (
        <p className={`text-[11px] mt-1 ${style.subColor}`}>{subText}</p>
      )}
    </Container>
  );
};
