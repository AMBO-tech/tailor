import React from 'react';
import { Check } from 'lucide-react';
import { OrderStatus } from './OrderStatusBadge';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus }) => {
  const steps: { id: OrderStatus; label: string }[] = [
    { id: 'EN_COURS', label: 'En cours' },
    { id: 'TERMINE', label: 'Terminé' },
    { id: 'LIVRE', label: 'Livré' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className="flex items-center justify-between w-full py-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isCurrent
                  ? 'bg-amber-500 border-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-100 border-slate-300 text-slate-400'
              }`}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <span
              className={`text-[9px] mt-1 text-center truncate ${
                isCurrent ? 'font-bold text-amber-700' : isCompleted ? 'text-emerald-600 font-medium' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
