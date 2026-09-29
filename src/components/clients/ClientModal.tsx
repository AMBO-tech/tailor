import React, { useState, useEffect, useId } from 'react';
import { Client, Gender, CreateClientDto, Measurements } from '@types';
import {
  X,
  User,
  Phone,
  Save,
  Ruler,
  Loader2,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateAndNormalizeSenegalPhone } from '@utils/phoneValidator';
import { MEASUREMENT_TEMPLATES, parseMeasurementInput } from '@utils/measurements';
import { toast } from '@services/toast';
import { getErrorMessage, wasErrorNotified } from '@utils/errors';
import { useModalA11y } from '@hooks/useModalA11y';

export interface ClientModalProps {
  client?: Client | null;
  initialData?: Client | null;
  isOpen?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (clientData: CreateClientDto) => Promise<unknown>;
  onSubmit?: (clientData: CreateClientDto) => Promise<unknown>;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  client,
  initialData,
  isOpen = true,
  isLoading: externalLoading = false,
  onClose,
  onSave,
  onSubmit,
}) => {
  const activeClient = client || initialData || null;

  const [fullName, setFullName] = useState(activeClient?.fullName || '');
  const [phone, setPhone] = useState(activeClient?.phone || '');
  const [gender, setGender] = useState<Gender>(activeClient?.gender || 'F');
  const [notes, setNotes] = useState(activeClient?.notes || '');
  const [measurements, setMeasurements] = useState<Measurements>(
    activeClient?.measurements || {},
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    activeClient?.gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeClient) {
      setFullName(activeClient.fullName || '');
      setPhone(activeClient.phone || '');
      setGender(activeClient.gender || 'F');
      setNotes(activeClient.notes || '');
      setMeasurements(activeClient.measurements || {});
      setSelectedTemplateKey(
        activeClient.gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME',
      );
    } else {
      setFullName('');
      setPhone('');
      setGender('F');
      setNotes('');
      setMeasurements({});
      setSelectedTemplateKey('ROBE_MARINIERE_FEMME');
    }
  }, [activeClient, isOpen]);

  const { titleId, dialogProps } = useModalA11y({ isOpen, onClose });
  // Identifiant généré une seule fois à l'ouverture : une relance (ou une
  // synchronisation hors ligne) ne crée jamais de doublon.
  const [draftClientId] = useState(() => activeClient?.id || uuidv4());
  const fieldId = useId();

  if (!isOpen) return null;

  const handleApplyTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const tmpl = MEASUREMENT_TEMPLATES[key];
    if (tmpl) {
      setGender(tmpl.gender);
    }
  };

  const handleMeasurementChange = (fieldKey: string, val: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [fieldKey]: parseMeasurementInput(val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const validatedPhone = validateAndNormalizeSenegalPhone(phone);
    if (!validatedPhone.isValid) {
      toast.warning('Veuillez renseigner un numéro de téléphone sénégalais valide (ex: 77 123 45 67).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateClientDto = {
        id: activeClient?.id || draftClientId,
        fullName,
        phone: validatedPhone.normalized,
        gender,
        notes,
        measurements,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else if (onSave) {
        await onSave(payload);
      }
      onClose();
    } catch (err: unknown) {
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, 'Erreur lors de la sauvegarde du client'));
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = MEASUREMENT_TEMPLATES[selectedTemplateKey];
  const isSubmitting = loading || externalLoading;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white border border-slate-200 w-full max-w-md rounded-t-[1.75rem] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 id={titleId} className="text-sm sm:text-base font-display font-bold text-slate-900">
              {activeClient ? 'Modifier la cliente' : 'Nouvelle cliente & Mesures'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Coordonnées et carnet de coupe
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Identity */}
          <div className="space-y-3">
            <div>
              <label htmlFor={`${fieldId}-name`} className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id={`${fieldId}-name`}
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 transition font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`${fieldId}-phone`} className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id={`${fieldId}-phone`}
                    type="tel"
                    required
                    inputMode="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <span id={`${fieldId}-gender`} className="block text-xs font-bold text-slate-700 mb-1">Genre</span>
                <div role="group" aria-labelledby={`${fieldId}-gender`} className="flex bg-slate-100 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('F');
                      handleApplyTemplate('ROBE_MARINIERE_FEMME');
                    }}
                    aria-pressed={gender === 'F'}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      gender === 'F' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Femme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('M');
                      handleApplyTemplate('BOUBOU_3_PIECES_HOMME');
                    }}
                    aria-pressed={gender === 'M'}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      gender === 'M' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Homme
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Carnet */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-900 font-bold text-xs">
                <Ruler className="w-4 h-4 text-amber-500" />
                <span>Mesures de coupe (cm)</span>
              </div>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {Object.entries(MEASUREMENT_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyTemplate(key)}
                  aria-pressed={selectedTemplateKey === key}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                    selectedTemplateKey === key
                      ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Template Fields */}
            {currentTemplate && (
              <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                {currentTemplate.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label
                      htmlFor={`${fieldId}-m-${field.key}`}
                      className="block text-[11px] font-medium text-slate-600 truncate"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`${fieldId}-m-${field.key}`}
                      type="text"
                      inputMode="decimal"
                      enterKeyHint="next"
                      autoComplete="off"
                      placeholder="0"
                      value={measurements[field.key] || ''}
                      onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-900 font-mono font-bold"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={`${fieldId}-notes`} className="block text-xs font-bold text-slate-700 mb-1">
              Notes & Préférences (Optionnel)
            </label>
            <textarea
              id={`${fieldId}-notes`}
              rows={2}
              placeholder="Ex: Aime les coupes amples, col rond..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 text-xs sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{activeClient ? 'Enregistrer les modifications' : 'Enregistrer la cliente'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
