import React, { useState } from 'react';
import { Client, Gender } from '../types';
import { X, User, Phone, Save, Ruler, Sparkles, ShieldCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateAndNormalizeSenegalPhone } from '../utils/phoneValidator';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: any) => Promise<void>;
}

const MEASUREMENT_TEMPLATES = {
  BOUBOU_3_PIECES_HOMME: {
    label: 'Boubou 3 Pièces (Homme)',
    gender: 'M' as Gender,
    fields: [
      { key: 'longueurBoubou', label: 'Longueur Boubou (cm)' },
      { key: 'epaule', label: 'Carrure / Épaule (cm)' },
      { key: 'manche', label: 'Longueur Manche (cm)' },
      { key: 'tourCou', label: 'Tour de Cou (cm)' },
      { key: 'tourPoitrine', label: 'Tour de Poitrine (cm)' },
      { key: 'longueurPantalon', label: 'Longueur Pantalon (cm)' },
      { key: 'tourCeinture', label: 'Tour de Ceinture / Taille (cm)' },
      { key: 'cuisse', label: 'Tour de Cuisse (cm)' },
      { key: 'basPantalon', label: 'Bas Pantalon (cm)' },
    ],
  },
  ROBE_MARINIERE_FEMME: {
    label: 'Robe Marinière (Femme)',
    gender: 'F' as Gender,
    fields: [
      { key: 'longueurRobe', label: 'Longueur Robe (cm)' },
      { key: 'epaule', label: 'Carrure / Épaule (cm)' },
      { key: 'tourPoitrine', label: 'Tour de Poitrine (cm)' },
      { key: 'tourTaille', label: 'Tour de Taille (cm)' },
      { key: 'tourBassin', label: 'Tour de Bassin / Hanches (cm)' },
      { key: 'manche', label: 'Longueur Manche (cm)' },
      { key: 'tourBras', label: 'Tour de Bras (cm)' },
    ],
  },
  TAILLE_BASSE_FEMME: {
    label: 'Taille Basse / Jupe (Femme)',
    gender: 'F' as Gender,
    fields: [
      { key: 'longueurHaut', label: 'Longueur Haut (cm)' },
      { key: 'tourPoitrine', label: 'Tour de Poitrine (cm)' },
      { key: 'tourTaille', label: 'Tour de Taille (cm)' },
      { key: 'longueurJupe', label: 'Longueur Jupe / Pagne (cm)' },
      { key: 'tourBassin', label: 'Tour de Bassin (cm)' },
      { key: 'epaule', label: 'Épaule (cm)' },
    ],
  },
  GRAND_BOUBOU: {
    label: 'Grand Boubou / Caftan',
    gender: 'M' as Gender,
    fields: [
      { key: 'longueurTotale', label: 'Longueur Totale (cm)' },
      { key: 'epaule', label: 'Épaule (cm)' },
      { key: 'manche', label: 'Manche (cm)' },
      { key: 'tourPoitrine', label: 'Tour de Poitrine (cm)' },
      { key: 'tourCou', label: 'Tour de Cou (cm)' },
    ],
  },
};

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
      alert('Veuillez renseigner un numéro de téléphone sénégalais valide (ex: 77 123 45 67).');
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
      alert(err.message || 'Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = (MEASUREMENT_TEMPLATES as any)[selectedTemplateKey];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {client ? 'Modifier Client' : 'Nouveau Client & Mesures'}
              </h2>
              <p className="text-xs text-slate-400">Fiche client et carnet de mesures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Identity Section */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom complet du client *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Téléphone (Sénégal) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
                <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('F');
                      handleApplyTemplate('ROBE_MARINIERE_FEMME');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      gender === 'F' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Femme (F)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('M');
                      handleApplyTemplate('BOUBOU_3_PIECES_HOMME');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      gender === 'M' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Homme (M)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Templates Bar */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                <span>Modèle de mesures sénégalais</span>
              </label>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {Object.entries(MEASUREMENT_TEMPLATES).map(([k, tmpl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleApplyTemplate(k)}
                  className={`text-left text-[11px] p-2 rounded-lg border transition font-medium truncate ${
                    selectedTemplateKey === k
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            {/* Form Fields for Measurements */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2">
              {currentTemplate?.fields.map((f: any) => (
                <div key={f.key}>
                  <label className="block text-[11px] text-slate-400 truncate mb-1">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="ex: 95"
                    value={measurements[f.key] || ''}
                    onChange={(e) => handleMeasurementChange(f.key, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 text-slate-100 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes & Préférences (coupes, finitions, doublure)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Aime les broderies dorées discrètes, col mao serré..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-600"
            />
          </div>

          {/* CDP Senegal Legal Notice */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Données protégées et confidentielles selon la Loi CDP Sénégal 2008-12.</span>
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer le client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
