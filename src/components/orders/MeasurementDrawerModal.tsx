import React, { useState, useEffect } from 'react';
import { Ruler, X, Check } from 'lucide-react';
import {
  MEASUREMENT_LABELS,
  finalizeMeasurements,
  getMeasurementLabel,
  isMeasurementFilled,
} from '@utils/measurements';
import { MeasurementBookEditor } from '../clients/MeasurementBookEditor';
import { Measurements } from '@types';
import { useModalA11y } from '@hooks/useModalA11y';

export interface MeasurementDrawerModalProps {
  isOpen?: boolean;
  initialMeasurements?: Measurements;
  measurements?: Measurements;
  clientName?: string;
  modelName?: string;
  isReadOnly?: boolean;
  onClose: () => void;
  onSave?: (updatedMeasurements: Measurements, shouldUpdateClient: boolean) => void;
}

export const MeasurementDrawerModal: React.FC<MeasurementDrawerModalProps> = ({
  isOpen = true,
  initialMeasurements,
  measurements,
  clientName,
  modelName,
  isReadOnly = false,
  onClose,
  onSave,
}) => {
  const activeMeasurements = initialMeasurements || measurements || {};
  const [localValues, setLocalValues] = useState<Measurements>(activeMeasurements);
  const [syncWithClient, setSyncWithClient] = useState(true);

  // Resynchronise les valeurs locales quand les mesures fournies changent.
  // On dépend des props elles-mêmes : le repli `{}` de `activeMeasurements` est
  // recréé à chaque rendu et relançait l'effet (et un rendu) en boucle.
  useEffect(() => {
    setLocalValues(initialMeasurements || measurements || {});
  }, [initialMeasurements, measurements]);

  const { titleId, dialogProps } = useModalA11y({ isOpen, onClose });

  if (!isOpen) return null;

  const handleApply = () => {
    if (onSave) {
      onSave(finalizeMeasurements(localValues), syncWithClient);
    }
    onClose();
  };

  const filledKeys = Object.keys(localValues).filter((k) => isMeasurementFilled(localValues[k]));
  const filledCount = filledKeys.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
              <Ruler className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 id={titleId} className="text-sm font-bold text-slate-900">
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
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {isReadOnly ? (
            filledKeys.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {filledKeys.map((key) => {
                  const hint = MEASUREMENT_LABELS[key]?.hint;
                  return (
                    <div
                      key={key}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-tight truncate">
                          {getMeasurementLabel(key)}
                        </span>
                        {hint && <span className="text-[9px] text-slate-400 truncate block">{hint}</span>}
                      </div>
                      <strong className="text-slate-900 font-mono text-sm ml-2">{localValues[key]} cm</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Aucune mesure enregistrée.</p>
            )
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-amber-700 font-bold text-right">
                {filledCount} mesure(s) renseignée(s)
              </p>
              <MeasurementBookEditor value={localValues} onChange={setLocalValues} />
            </div>
          )}

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
