import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-display font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow-2xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
