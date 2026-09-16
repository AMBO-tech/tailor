import React, { useState } from 'react';
import { Client, Gender } from '@types';
import {
  X,
  User,
  Phone,
  Save,
  Ruler,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateAndNormalizeSenegalPhone } from '@utils/phoneValidator';
import { MEASUREMENT_TEMPLATES } from '@utils/measurements';
import { toast } from '@services/toast';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: any) => Promise<void>;
}

export const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
  const [fullName, setFullName] = useState(client?.fullName || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [gender, setGender] = useState<Gender>(client?.gender || 'F');
  const [notes, setNotes] = useState(client?.notes || '');
  const [measurements, setMeasurements] = useState<Record<string, any>>(
    client?.measurements || {},
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    client?.gender === 'M' ? 'BOUBOU_3_PIECES_HOMME' : 'ROBE_MARINIERE_FEMME',
  );
  const [loading, setLoading] = useState(false);

  const handleApplyTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const tmpl = (MEASUREMENT_TEMPLATES as any)[key];
    if (tmpl) {
      setGender(tmpl.gender);
    }
  };

  const handleMeasurementChange = (fieldKey: string, val: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [fieldKey]: val ? Number(val) || val : '',
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
      await onSave({
        id: client?.id || uuidv4(),
        fullName,
        phone: validatedPhone.normalized,
        gender,
        notes,
        measurements,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = (MEASUREMENT_TEMPLATES as any)[selectedTemplateKey];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {client ? 'Modifier la cliente' : 'Nouvelle cliente & Mesures'}
            </h2>
            <p className="text-xs text-slate-500">
              Coordonnées et carnet de coupe
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Identity */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Genre</label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('F');
                      handleApplyTemplate('ROBE_MARINIERE_FEMME');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      gender === 'F' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      gender === 'M' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Homme
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Templates */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-amber-600" />
                <span>Gabarits de coupe</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {Object.entries(MEASUREMENT_TEMPLATES).map(([k, tmpl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleApplyTemplate(k)}
                  className={`text-left text-xs p-2 rounded-xl border transition font-semibold truncate ${
                    selectedTemplateKey === k
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            {/* Measurement Inputs */}
            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 border border-slate-200">
              {currentTemplate?.fields.map((f: any) => (
                <div key={f.key}>
                  <label className="block text-[11px] text-slate-500 font-medium truncate mb-1">
                    {f.label} (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="ex: 95"
                    value={measurements[f.key] || ''}
                    onChange={(e) => handleMeasurementChange(f.key, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes & Préférences
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Fentes hautes, doublure légère..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
            />
          </div>

          {/* Sticky Save Button */}
          <div className="pt-2 sticky bottom-0 bg-white modal-sheet-safe">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer la cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

