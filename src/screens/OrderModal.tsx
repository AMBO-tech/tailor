import React, { useEffect, useState } from 'react';
import { Client, Order } from '../types';
import { db } from '../db/db';
import {
  X,
  ShoppingBag,
  User,
  Calendar,
  Wallet,
  Camera,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface OrderModalProps {
  order?: Order | null;
  initialClient?: Client | null;
  onClose: () => void;
  onSave: (orderData: any) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  initialClient,
  onClose,
  onSave,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    order?.clientId || initialClient?.id || '',
  );
  const [modelName, setModelName] = useState(order?.modelName || '');
  const [fabricPhotoUrl, setFabricPhotoUrl] = useState(
    order?.fabricPhotoUrl || '',
  );
  const [totalAmount, setTotalAmount] = useState<number | string>(
    order?.totalAmount || '',
  );
  const [depositAmount, setDepositAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  // Default dates: fitting in 5 days, delivery in 8 days
  const defaultFitting = new Date(Date.now() + 5 * 24 * 3600 * 1000)
    .toISOString()
    .split('T')[0];
  const defaultDelivery = new Date(Date.now() + 8 * 24 * 3600 * 1000)
    .toISOString()
    .split('T')[0];

  const [fittingDate, setFittingDate] = useState(
    order?.fittingDate ? order.fittingDate.split('T')[0] : defaultFitting,
  );
  const [deliveryDeadline, setDeliveryDeadline] = useState(
    order?.deliveryDeadline
      ? order.deliveryDeadline.split('T')[0]
      : defaultDelivery,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.clients.toArray().then((list) => {
      setClients(list);
      if (!selectedClientId && list.length > 0 && !initialClient) {
        setSelectedClientId(list[0].id);
      }
    });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFabricPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !modelName || !totalAmount || !deliveryDeadline) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const client = clients.find((c) => c.id === selectedClientId) || initialClient;
      const clientMutationId = uuidv4();

      await onSave({
        id: order?.id || uuidv4(),
        clientMutationId,
        clientId: selectedClientId,
        modelName,
        fabricPhotoUrl: fabricPhotoUrl || undefined,
        totalAmount: Number(totalAmount),
        depositAmount: depositAmount ? Number(depositAmount) : 0,
        paymentMethod,
        fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
        deliveryDeadline: new Date(deliveryDeadline).toISOString(),
        measurementSnapshot: client?.measurements || {},
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient =
    clients.find((c) => c.id === selectedClientId) || initialClient;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {order ? `Modifier #${order.orderNumber}` : 'Nouvelle Commande'}
              </h2>
              <p className="text-xs text-slate-400">
                Enregistrement commande, tissu & acompte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Client associé *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            {selectedClient && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  Mesures chargées ({Object.keys(selectedClient.measurements || {}).length} points)
                </span>
              </p>
            )}
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Modèle / Tenue à confectionner *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Boubou 3 pièces Bazin Getzner brodé or"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
            />
          </div>

          {/* Photo Tissu / Modèle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Photo du tissu / Modèle souhaité
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 rounded-xl p-3 flex items-center justify-center gap-2 flex-1 text-xs transition">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{fabricPhotoUrl ? 'Changer la photo' : 'Prendre / Choisir photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {fabricPhotoUrl && (
                <img
                  src={fabricPhotoUrl}
                  alt="Tissu"
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 shadow"
                />
              )}
            </div>
          </div>

          {/* Financials: Total & Advance */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prix total (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 25000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!order && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Acompte immédiat (FCFA)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {!order && depositAmount && Number(depositAmount) > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Mode de règlement de l'acompte
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['CASH', 'WAVE', 'ORANGE_MONEY'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-2 rounded-lg font-semibold border transition ${
                        paymentMethod === m
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m === 'CASH' ? 'Espèces' : m === 'WAVE' ? 'Wave' : 'Orange M.'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates: Fitting & Promised Delivery */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date d'essayage
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={fittingDate}
                  onChange={(e) => setFittingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-2 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Livraison promise *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-rose-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Création en cours...' : 'Créer la commande'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
