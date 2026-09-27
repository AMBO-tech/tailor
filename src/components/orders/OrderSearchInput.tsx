import React from 'react';
import { Search, Plus, X } from 'lucide-react';

export interface OrderSearchInputProps {
  value?: string;
  searchQuery?: string;
  onChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onNewOrder?: () => void;
  placeholder?: string;
}

export const OrderSearchInput: React.FC<OrderSearchInputProps> = ({
  value,
  searchQuery,
  onChange,
  onSearchChange,
  onNewOrder,
  placeholder = 'Rechercher une commande...',
}) => {
  const activeValue = value !== undefined ? value : searchQuery || '';
  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          aria-label="Rechercher une commande"
          placeholder={placeholder}
          value={activeValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-sm text-slate-900 placeholder-slate-400"
        />
        {activeValue && (
          <button
            onClick={() => handleChange('')}
            type="button"
            aria-label="Effacer la recherche"
            className="absolute right-2.5 top-2.5 p-[5px] -m-[3px] text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {onNewOrder && (
        <button
          onClick={onNewOrder}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouvelle</span>
        </button>
      )}
    </div>
  );
};
