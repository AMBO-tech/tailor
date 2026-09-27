import React from 'react';
import { Client } from '@types';
import { Phone, MessageCircle, Scissors, Ruler, Edit2 } from 'lucide-react';
import { getMeasurementLabel } from '@utils/measurements';

export interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onNewOrder?: (client: Client) => void;
  onNewOrderForClient?: (client: Client) => void;
  onOpenWhatsApp?: (phone: string, name: string) => void;
  onViewMeasurements?: (client: Client) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onEditClient,
  onNewOrder,
  onNewOrderForClient,
  onOpenWhatsApp,
  onViewMeasurements,
}) => {
  const measurementKeys = Object.keys(client.measurements || {}).filter(
    (k) =>
      client.measurements[k] !== '' &&
      client.measurements[k] !== null &&
      client.measurements[k] !== undefined,
  );

  const handleEdit = () => {
    if (onEdit) onEdit(client);
    if (onEditClient) onEditClient(client);
  };

  const handleNewOrder = () => {
    if (onNewOrder) onNewOrder(client);
    if (onNewOrderForClient) onNewOrderForClient(client);
  };

  const handleWhatsApp = () => {
    if (onOpenWhatsApp) {
      onOpenWhatsApp(client.phone, client.fullName);
    } else {
      const cleanPhone = client.phone.replace(/[^0-9]/g, '');
      const internationalPhone = cleanPhone.startsWith('221')
        ? cleanPhone
        : `221${cleanPhone}`;
      const text = encodeURIComponent(
        `Bonjour ${client.fullName}, j'espère que vous allez bien ! C'est votre atelier de couture.`,
      );
      window.open(`https://wa.me/${internationalPhone}?text=${text}`, '_blank');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-display font-bold text-xs shrink-0">
            {getInitials(client.fullName)}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
              {client.fullName}
            </h3>
            <a
              href={`tel:${client.phone}`}
              className="text-xs text-slate-500 font-mono flex items-center gap-1 hover:text-slate-900"
            >
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{client.phone}</span>
            </a>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {client.gender === 'M' ? 'Homme' : 'Femme'}
        </span>
      </div>

      {/* Measurements Pills summary */}
      {measurementKeys.length > 0 ? (
        <button
          type="button"
          onClick={() => onViewMeasurements?.(client)}
          aria-label={`Voir le carnet de mesures de ${client.fullName}`}
          className="block w-full text-left bg-slate-50 rounded-xl p-2.5 space-y-1.5 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Ruler className="w-3 h-3 text-amber-500" />
              Carnet de coupe
            </span>
            <span>{measurementKeys.length} mesure(s)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {measurementKeys.slice(0, 5).map((k) => (
              <span
                key={k}
                className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-700"
              >
                {getMeasurementLabel(k)}: <strong>{client.measurements[k]}cm</strong>
              </span>
            ))}
            {measurementKeys.length > 5 && (
              <span className="text-[10px] text-slate-400 self-center pl-1">
                +{measurementKeys.length - 5}
              </span>
            )}
          </div>
        </button>
      ) : (
        <div className="bg-slate-50 rounded-xl p-2 text-[11px] text-slate-400 italic text-center">
          Aucune mesure enregistrée
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            type="button"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition active:scale-95"
            title="Modifier fiche & mesures"
            aria-label="Modifier fiche & mesures"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleWhatsApp}
            type="button"
            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition active:scale-95"
            title="Contacter sur WhatsApp"
            aria-label="Contacter sur WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleNewOrder}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Commander</span>
        </button>
      </div>
    </div>
  );
};
