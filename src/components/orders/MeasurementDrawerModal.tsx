import React, { useState, useEffect } from 'react';
import { Ruler, X, Check, Edit2, Sparkles, UserCheck } from 'lucide-react';
import { MEASUREMENT_TEMPLATES, MEASUREMENT_LABELS, getMeasurementLabel } from '@utils/measurements';

export interface MeasurementDrawerModalProps {
  isOpen?: boolean;
  initialMeasurements?: Record<string, any>;
  measurements?: Record<string, any>;
  clientName?: string;
  modelName?: string;
  isReadOnly?: boolean;
  gender?: 'M' | 'F';
  onClose: () => void;
  onSave?: (updatedMeasurements: Record<string, any>, shouldUpdateClient: boolean) => void;
}

export const MeasurementDrawerModal: React.FC<MeasurementDrawerModalProps> = ({
  isOpen = true,
  initialMeasurements,
  measurements,
  clientName,
  modelName,
  isReadOnly = false,
  gender = 'F',
  onClose,
  onSave,
}) => {
  const activeMeasurements = initialMeasurements || measurements || {};
  const [localValues, setLocalValues] = useState<Record<string, any>>(activeMeasurements);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME',
  );
  const [syncWithClient, setSyncWithClient] = useState(true);

  useEffect(() => {
    setLocalValues(activeMeasurements);
  }, [activeMeasurements]);

  if (!isOpen) return null;

  const currentTemplate =
    (MEASUREMENT_TEMPLATES as any)[selectedTemplate] ||
    MEASUREMENT_TEMPLATES.ROBE_MARINIERE_FEMME;

  const handleValueChange = (key: string, val: string) => {
    const num = val ? Number(val) || val : '';
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

  const filledCount = Object.values(localValues).filter(
    (v) => v !== '' && v !== null && v !== undefined,
  ).length;

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
            {currentTemplate.fields.map((f: any) => {
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
                    <strong className="text-slate-900 font-mono text-sm ml-2">
                      {val ? `${val} cm` : '-'}
                    </strong>
                  </div>
                );
              }

              return (
                <div
                  key={f.key}
                  className="bg-slate-50/50 border border-slate-200/70 rounded-xl p-2 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition"
                >
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate mb-1">
                    {f.label}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={val}
                      onChange={(e) => handleValueChange(f.key, e.target.value)}
                      className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 focus:outline-none pr-6"
                    />
                    <span className="text-[10px] text-slate-400 font-mono absolute right-1">cm</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync checkbox */}
          {!isReadOnly && clientName && (
            <label className="flex items-center gap-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={syncWithClient}
                onChange={(e) => setSyncWithClient(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <span className="text-[11px] font-medium">
                Mettre aussi à jour la fiche profil de <strong>{clientName}</strong>
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition"
          >
            Fermer
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleApply}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow-2xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Valider les mesures</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
