import React from 'react';
import { Search, Plus, X } from 'lucide-react';

export interface ClientSearchInputProps {
  value?: string;
  searchQuery?: string;
  onChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onNewClient?: () => void;
  placeholder?: string;
}

export const ClientSearchInput: React.FC<ClientSearchInputProps> = ({
  value,
  searchQuery,
  onChange,
  onSearchChange,
  onNewClient,
  placeholder = 'Rechercher cliente ou téléphone...',
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
          aria-label="Rechercher une cliente"
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

      {onNewClient && (
        <button
          onClick={onNewClient}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ajouter</span>
        </button>
      )}
    </div>
  );
};
