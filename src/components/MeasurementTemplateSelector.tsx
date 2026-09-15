import React from 'react';
import { Sparkles } from 'lucide-react';

interface MeasurementTemplateSelectorProps {
  onSelect: (templateName: string, defaultFields: Record<string, string>) => void;
}

export const MeasurementTemplateSelector: React.FC<MeasurementTemplateSelectorProps> = ({ onSelect }) => {
  const templates = [
    {
      id: 'BOUBOU_H',
      label: 'Boubou Homme',
      fields: { longueurBoubou: '', epaule: '', manche: '', tourCou: '', tourPoitrine: '', longueurPantalon: '', tourCeinture: '' },
    },
    {
      id: 'ROBE_F',
      label: 'Robe Marinière',
      fields: { longueurRobe: '', epaule: '', tourPoitrine: '', tourTaille: '', tourBassin: '', manche: '' },
    },
    {
      id: 'ENSEMBLE_F',
      label: 'Jupe & Haut',
      fields: { longueurHaut: '', epaule: '', tourPoitrine: '', tourTaille: '', longueurJupe: '', tourBassin: '' },
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Gabarits de mesures rapides :</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.label, t.fields)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
