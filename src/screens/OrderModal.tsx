import React, { useEffect, useState } from 'react';
import { Client, Order } from '@types';
import { api } from '@services/api';
import {
  X,
  ShoppingBag,
  User,
  Calendar,
  Camera,
  Save,
  Loader2,
  Ruler,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PhotoCaptureInput } from '@components/PhotoCaptureInput';
import { ClientPicker } from '@components/ClientPicker';
import { MeasurementDrawerModal } from '@components/MeasurementDrawerModal';
import { getMeasurementLabel } from '@utils/measurements';
import { ClientModal } from '@screens/ClientModal';
import { toast } from '@services/toast';

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
  const [orderMeasurements, setOrderMeasurements] = useState<Record<string, any>>(
    order?.measurementSnapshot || initialClient?.measurements || {},
  );
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

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
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState(false);

  useEffect(() => {
    api.listClients()
      .then((list) => {
        const clientList: Client[] = Array.isArray(list) ? list : [];
        setClients(clientList);
        if (!selectedClientId && clientList.length > 0 && !initialClient) {
          setSelectedClientId(clientList[0].id);
          if (clientList[0].measurements && Object.keys(orderMeasurements).length === 0) {
            setOrderMeasurements(clientList[0].measurements);
          }
        }
      })
      .catch((err) => {
        console.warn('Error fetching clients for OrderModal:', err);
      });
  }, []);

  const handleSelectClientFromPicker = (client: Client | null) => {
    if (client) {
      setSelectedClientId(client.id);
      if (client.measurements && Object.keys(client.measurements).length > 0) {
        setOrderMeasurements(client.measurements);
      }
    } else {
      setSelectedClientId('');
    }
  };

  const handleQuickSaveClient = async (clientData: any) => {
    try {
      const created = await api.createClient(clientData);
      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);
      if (created.measurements && Object.keys(created.measurements).length > 0) {
        setOrderMeasurements(created.measurements);
      }
      setIsQuickClientModalOpen(false);
      toast.success(`Cliente ${created.fullName} ajoutée avec succès ✨`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de la cliente');
    }
  };

  const handleSaveMeasurementsFromModal = async (
    updatedMeasurements: Record<string, any>,
    shouldUpdateClient: boolean,
  ) => {
    setOrderMeasurements(updatedMeasurements);
    if (shouldUpdateClient && selectedClientId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClientId ? { ...c, measurements: updatedMeasurements } : c,
        ),
      );
    }
  };

  const handleSetDepositPercentage = (pct: number) => {
    const total = Number(totalAmount);
    if (!total || isNaN(total)) return;
    setDepositAmount(Math.round(total * pct));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !modelName || !totalAmount || !deliveryDeadline) {
      toast.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (depositAmount && Number(depositAmount) > Number(totalAmount)) {
      toast.warning("L'acompte ne peut pas être supérieur au prix total.");
      return;
    }

    setLoading(true);
    try {
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
        measurementSnapshot: orderMeasurements || {},
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const currentClient = clients.find((c) => c.id === selectedClientId) || initialClient;
  const measurementKeys = Object.keys(orderMeasurements || {}).filter(
    (k) => orderMeasurements[k] !== '' && orderMeasurements[k] !== null && orderMeasurements[k] !== undefined,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {order ? `Modifier #${order.orderNumber}` : 'Nouvelle commande'}
            </h2>
            <p className="text-xs text-slate-500">
              Modèle, mesures & acompte
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Sélecteur de Cliente avec Recherche Instantanée */}
          <ClientPicker
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={handleSelectClientFromPicker}
            onQuickCreateClient={() => setIsQuickClientModalOpen(true)}
            required
          />

          {/* Widget Mesures de la Commande */}
          {selectedClientId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Ruler className="w-4 h-4 text-amber-600" />
                  <span>Mesures pour cette coupe</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMeasurementModalOpen(true)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition active:scale-95 flex items-center gap-1"
                >
                  <Ruler className="w-3 h-3" />
                  <span>{measurementKeys.length > 0 ? 'Ajuster' : '+ Saisir'}</span>
                </button>
              </div>

              {measurementKeys.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {measurementKeys.slice(0, 4).map((k) => (
                    <span
                      key={k}
                      className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono"
                    >
                      {getMeasurementLabel(k)} : <strong>{orderMeasurements[k]}cm</strong>
                    </span>
                  ))}
                  {measurementKeys.length > 4 && (
                    <span className="text-[10px] text-slate-500 font-semibold self-center">
                      +{measurementKeys.length - 4} autres...
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Aucune mesure enregistrée. Cliquez sur « + Saisir » pour enregistrer les mensurations.
                </p>
              )}
            </div>
          )}

          {/* Modèle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Modèle & Tissu *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Grand Boubou Bazin brodé"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Photo Tissu avec options Caméra directe et Galerie */}
          <PhotoCaptureInput
            value={fabricPhotoUrl}
            onChange={setFabricPhotoUrl}
            label="Photo du tissu / modèle"
          />

          {/* Prix & Acompte */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-2.5 border border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prix total (FCFA) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  placeholder="Ex: 25000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {!order && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Acompte versé
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex: 10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Deposit shortcut chips */}
            {!order && totalAmount && Number(totalAmount) > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  Acompte :
                </span>
                <button
                  type="button"
                  onClick={() => handleSetDepositPercentage(0.5)}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDepositPercentage(1.0)}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                >
                  100% Soldé
                </button>
              </div>
            )}

            {/* Mode de paiement */}
            {!order && depositAmount && Number(depositAmount) > 0 && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Moyen de paiement
                </label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {[
                    { id: 'CASH', label: 'Espèces' },
                    { id: 'WAVE', label: 'Wave' },
                    { id: 'ORANGE_MONEY', label: 'Orange Money' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 rounded-xl font-bold border transition text-center text-xs active:scale-95 ${
                        paymentMethod === m.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date d'essayage
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={fittingDate}
                  onChange={(e) => setFittingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Livraison promise *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Sticky Save Button */}
          <div className="pt-2 sticky bottom-0 bg-white modal-sheet-safe">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Création...' : 'Créer la commande'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Client Modal */}
      {isQuickClientModalOpen && (
        <ClientModal
          onClose={() => setIsQuickClientModalOpen(false)}
          onSave={handleQuickSaveClient}
        />
      )}

      {/* Measurement Adjustment Modal */}
      {isMeasurementModalOpen && (
        <MeasurementDrawerModal
          isOpen={isMeasurementModalOpen}
          onClose={() => setIsMeasurementModalOpen(false)}
          clientName={currentClient?.fullName}
          modelName={modelName}
          measurements={orderMeasurements}
          gender={currentClient?.gender || 'F'}
          onSave={handleSaveMeasurementsFromModal}
        />
      )}
    </div>
  );
};

