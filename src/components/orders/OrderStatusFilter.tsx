import React from 'react';

export interface OrderStatusFilterProps {
  currentFilter: string;
  onSelectFilter?: (filter: string) => void;
  onFilterChange?: (filter: string) => void;
}

export const OrderStatusFilter: React.FC<OrderStatusFilterProps> = ({
  currentFilter,
  onSelectFilter,
  onFilterChange,
}) => {
  const handleChange = (key: string) => {
    if (onFilterChange) onFilterChange(key);
    if (onSelectFilter) onSelectFilter(key);
  };

  const filters = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'TERMINE', label: 'Terminées' },
    { key: 'LIVRE', label: 'Livrées' },
    { key: 'ANNULE', label: 'Annulées' },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
      {filters.map((f) => {
        const isActive = currentFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => handleChange(f.key)}
            type="button"
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
              isActive
                ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};
