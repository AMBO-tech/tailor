import React, { useState, useMemo } from 'react';
import { Client } from '@types';
import { Search, Phone, Check, Plus, X, Ruler } from 'lucide-react';

export interface ClientPickerProps {
  clients: Client[];
  selectedClientId: string;
  onSelectClient: (client: Client | null) => void;
  onQuickCreateClient?: () => void;
  required?: boolean;
}

export const ClientPicker: React.FC<ClientPickerProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onQuickCreateClient,
  required = true,
}) => {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const filteredClients = useMemo(() => {
    if (!search.trim()) {
      return clients.slice(0, 8); // Top 8 récents
    }
    const q = search.toLowerCase().replace(/[\s\-\.]/g, '');
    return clients.filter((c) => {
      const cleanPhone = c.phone.replace(/[\s\-\.]/g, '');
      const cleanName = c.fullName.toLowerCase();
      return cleanName.includes(search.toLowerCase()) || cleanPhone.includes(q);
    });
  }, [clients, search]);

  // Si une cliente est sélectionnée et qu'on n'est pas en train de chercher
  if (selectedClient && !isSearching) {
    const measurementsCount = Object.keys(selectedClient.measurements || {}).length;

    return (
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700">
          Cliente {required && <span className="text-amber-600">*</span>}
        </label>
        <div className="bg-white border border-amber-300 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                selectedClient.gender === 'F'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {selectedClient.fullName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {selectedClient.fullName}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span className="font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedClient.phone}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <Ruler className="w-3 h-3" />
                  {measurementsCount > 0 ? `${measurementsCount} mesure(s)` : 'Sans mesures'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSearching(true);
              setSearch('');
            }}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl transition active:scale-95 shrink-0 ml-2"
          >
            Changer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Choisir la Cliente {required && <span className="text-amber-600">*</span>}
        </label>
        {onQuickCreateClient && (
          <button
            type="button"
            onClick={onQuickCreateClient}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3 h-3" />
            <span>Nouvelle cliente</span>
          </button>
        )}
      </div>

      {/* Barre de Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          autoFocus={isSearching}
          placeholder="Taper le prénom, nom ou numéro (ex: 77 123...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-amber-300/80 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Liste des résultats filtrés */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
        {filteredClients.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Aucune cliente trouvée pour « <strong className="text-slate-800">{search}</strong> »
            </p>
            {onQuickCreateClient && (
              <button
                type="button"
                onClick={onQuickCreateClient}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Créer « {search} »</span>
              </button>
            )}
          </div>
        ) : (
          filteredClients.map((c) => {
            const isSelected = c.id === selectedClientId;
            const count = Object.keys(c.measurements || {}).length;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectClient(c);
                  setIsSearching(false);
                  setSearch('');
                }}
                className={`w-full text-left p-2.5 flex items-center justify-between gap-2 hover:bg-amber-50/60 transition ${
                  isSelected ? 'bg-amber-50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      c.gender === 'F'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {c.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{c.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {count > 0 && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                      {count} mes.
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
