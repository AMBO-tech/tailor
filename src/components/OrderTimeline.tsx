import React from 'react';
import { Check } from 'lucide-react';
import { OrderStatus } from './OrderStatusBadge';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus }) => {
  const steps: { id: OrderStatus; label: string }[] = [
    { id: 'DRAFT', label: 'Création' },
    { id: 'CUTTING', label: 'Coupe' },
    { id: 'SEWING', label: 'Couture' },
    { id: 'FITTING_READY', label: 'Essayage' },
    { id: 'COMPLETED', label: 'Prêt' },
    { id: 'DELIVERED', label: 'Livré' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className=flex items-center justify-between w-full py-2>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.id} className=flex flex-col items-center flex-1>
            <div
              className={w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition }
            >
              {isCompleted ? <Check className=w-3.5 h-3.5 /> : idx + 1}
            </div>
            <span
              className={	ext-[9px] mt-1 text-center truncate }
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
