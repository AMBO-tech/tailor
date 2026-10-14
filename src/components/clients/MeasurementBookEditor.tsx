import React, { useEffect, useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Measurements } from '@types';
import {
  MAX_MEASUREMENTS,
  MAX_MEASUREMENT_NAME_LENGTH,
  MEASUREMENT_LABELS,
  addMeasurement,
  getMeasurementLabel,
  parseMeasurementInput,
  removeMeasurement,
} from '@utils/measurements';
import { toast } from '@services/toast';

export interface MeasurementBookEditorProps {
  value: Measurements;
  onChange: (next: Measurements) => void;
}

/**
 * Carnet de mesures libre : le tailleur ajoute les mesures dont la couture a besoin
 * (suggestions en un appui, ou un nom de son choix), saisit les valeurs en cm et retire
 * celles qui ne servent pas.
 */
export const MeasurementBookEditor: React.FC<MeasurementBookEditorProps> = ({ value, onChange }) => {
  const fieldId = useId();
  const [newName, setNewName] = useState('');
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Place le curseur dans la mesure qui vient d'être ajoutée.
  useEffect(() => {
    if (!focusKey) return;
    inputs.current[focusKey]?.focus();
    setFocusKey(null);
  }, [focusKey, value]);

  const keys = Object.keys(value);
  const suggestions = Object.keys(MEASUREMENT_LABELS).filter((key) => !(key in value));

  const add = (name: string) => {
    const result = addMeasurement(value, name);
    if (!result) {
      if (keys.length >= MAX_MEASUREMENTS) toast.warning(`${MAX_MEASUREMENTS} mesures au maximum.`);
      return false;
    }
    if (result.book !== value) onChange(result.book);
    setFocusKey(result.key);
    return true;
  };

  const addCustom = () => {
    if (add(newName)) setNewName('');
  };

  return (
    <div className="space-y-2.5">
      {keys.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {keys.map((key) => {
            const label = getMeasurementLabel(key);
            const inputId = `${fieldId}-${key}`;
            return (
              <div
                key={key}
                className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-2 focus-within:border-amber-500 focus-within:bg-white transition"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label
                    htmlFor={inputId}
                    className="block text-[11px] font-bold text-slate-600 truncate"
                    title={MEASUREMENT_LABELS[key]?.hint}
                  >
                    {label}
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange(removeMeasurement(value, key))}
                    aria-label={`Retirer la mesure ${label}`}
                    className="p-0.5 text-slate-400 hover:text-red-600 rounded-md shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id={inputId}
                    ref={(el) => {
                      inputs.current[key] = el;
                    }}
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    autoComplete="off"
                    placeholder="0"
                    value={value[key] ?? ''}
                    onChange={(e) => onChange({ ...value, [key]: parseMeasurementInput(e.target.value) })}
                    className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 focus:outline-none pr-6"
                  />
                  <span className="text-[10px] text-slate-400 font-mono absolute right-1">cm</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center">
          Aucune mesure pour l’instant : ajoutez celles dont cette couture a besoin.
        </p>
      )}

      {/* Mesure au nom libre */}
      <div className="flex gap-1.5">
        <label htmlFor={`${fieldId}-new`} className="sr-only">
          Nom de la nouvelle mesure
        </label>
        <input
          id={`${fieldId}-new`}
          type="text"
          value={newName}
          maxLength={MAX_MEASUREMENT_NAME_LENGTH}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            // Entrée ajoute la mesure au lieu d'envoyer le formulaire parent.
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Autre mesure (ex : Tour de bras)"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-900"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!newName.trim()}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white disabled:opacity-40 flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Suggestions en un appui */}
      {suggestions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {suggestions.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => add(key)}
              aria-label={`Ajouter la mesure ${getMeasurementLabel(key)}`}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 active:scale-95 transition"
            >
              + {getMeasurementLabel(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
