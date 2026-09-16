import React, { useState, useEffect } from 'react';
import { Ruler, X, Check, Edit2, Sparkles, UserCheck } from 'lucide-react';
import { MEASUREMENT_TEMPLATES, MEASUREMENT_LABELS, getMeasurementLabel } from '../utils/measurements';

interface MeasurementDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  modelName?: string;
  measurements: Record<string, any>;
  onSave?: (updatedMeasurements: Record<string, any>, shouldUpdateClient: boolean) => void;
  isReadOnly?: boolean;
  gender?: 'M' | 'F';
}

export const MeasurementDrawerModal: React.FC<MeasurementDrawerModalProps> = ({
  isOpen,
  onClose,
  clientName,
  modelName,
  measurements,
  onSave,
  isReadOnly = false,
  gender = 'F',
}) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME',
  );
  const [syncWithClient, setSyncWithClient] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLocalValues(measurements || {});
      setSelectedTemplate(gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME');
    }
  }, [isOpen, measurements, gender]);

  if (!isOpen) return null;

  const currentTemplate = MEASUREMENT_TEMPLATES[selectedTemplate] || MEASUREMENT_TEMPLATES.ROBE_MARINIERE_FEMME;

  const handleValueChange = (key: string, val: string) => {
    const num = val ? Number(val) : '';
    setLocalValues((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleApply = () => {
    if (onSave) {
      onSave(localValues, syncWithClient);
    }
    onClose();
  };

  const filledCount = Object.values(localValues).filter((v) => v !== '' && v !== null && v !== undefined).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
              <Ruler className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isReadOnly ? 'Mesures de Coupe' : 'Ajuster les Mesures'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {clientName ? `Pour ${clientName}` : 'Carnet de mesures'} {modelName ? `• ${modelName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Template Selector Pills */}
          {!isReadOnly && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Gabarit de confection
                </label>
                <span className="text-[11px] text-amber-700 font-bold">
                  {filledCount} mesure(s) renseignée(s)
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {Object.entries(MEASUREMENT_TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                      selectedTemplate === key
                        ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Measurements Fields Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {currentTemplate.fields.map((f) => {
              const val = localValues[f.key] ?? '';
              const hint = MEASUREMENT_LABELS[f.key]?.hint;

              if (isReadOnly) {
                return (
                  <div
                    key={f.key}
                    className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-tight truncate">
                        {f.label}
                      </span>
                      {hint && <span className="text-[9px] text-slate-400 truncate block">{hint}</span>}
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-900 shrink-0 ml-2">
                      {val !== '' ? `${val} cm` : '—'}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={f.key}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-300 transition"
                >
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate mb-1">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={val}
                      onChange={(e) => handleValueChange(f.key, e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-slate-900 text-sm focus:outline-none tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">cm</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Option Sync with Client Profile */}
          {!isReadOnly && onSave && (
            <label className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncWithClient}
                onChange={(e) => setSyncWithClient(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  Enregistrer aussi sur le profil client
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Met à jour le carnet de mesures principal pour ses prochaines commandes.
                </span>
              </div>
            </label>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white modal-sheet-safe">
          {isReadOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition text-xs active:scale-98"
            >
              Fermer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 text-xs sm:text-sm"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Valider les mesures de la commande</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
