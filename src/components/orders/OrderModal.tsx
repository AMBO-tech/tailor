import React, { useEffect, useId, useRef, useState } from 'react';
import { Client, Order, CreateOrderDto, CreateClientDto, Measurements } from '@types';
import { api } from '@services/api';
import {
  X,
  ShoppingBag,
  Save,
  Loader2,
  Ruler,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PhotoCaptureInput } from './PhotoCaptureInput';
import { ClientPicker } from '@components/clients/ClientPicker';
import { MeasurementDrawerModal } from './MeasurementDrawerModal';
import { getMeasurementLabel } from '@utils/measurements';
import { ClientModal } from '@components/clients/ClientModal';
import { toast } from '@services/toast';
import { getErrorMessage, wasErrorNotified } from '@utils/errors';
import { useModalA11y } from '@hooks/useModalA11y';
import { useClientsQuery } from '@hooks/useClients';
import { buildOptimisticClient, runOrQueue } from '@services/offlineQueue';

export interface OrderModalProps {
  order?: Order | null;
  initialClient?: Client | null;
  clients?: Client[];
  isOpen?: boolean;
  preselectedClientId?: string;
  isLoading?: boolean;
  onClose: () => void;
  onSave?: (orderData: CreateOrderDto) => Promise<unknown>;
  onSubmit?: (orderData: CreateOrderDto) => Promise<unknown>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  initialClient,
  clients: initialClientsList,
  isOpen = true,
  preselectedClientId,
  isLoading: externalLoading = false,
  onClose,
  onSave,
  onSubmit,
}) => {
  const [clients, setClients] = useState<Client[]>(initialClientsList || []);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    order?.clientId || preselectedClientId || initialClient?.id || '',
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
  const [orderMeasurements, setOrderMeasurements] = useState<Measurements>(
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
  const { titleId, dialogProps } = useModalA11y({ isOpen, onClose });
  const fieldId = useId();
  // ARC-3 : identifiants générés une seule fois à l'ouverture du formulaire. Une
  // relance (réseau lent, double appui) réutilise les mêmes : le serveur peut
  // dédoublonner au lieu de créer une deuxième commande.
  const [draftIds] = useState(() => ({
    id: order?.id || uuidv4(),
    clientMutationId: uuidv4(),
  }));

  // FE-2 : la liste des clientes vient des props ou, à défaut, du cache TanStack
  // Query (même clé que les pages : aucun appel supplémentaire si déjà chargée).
  const hasPropClients = Boolean(initialClientsList && initialClientsList.length > 0);
  const { data: queriedClients } = useClientsQuery(undefined, { enabled: !hasPropClients });
  const sourceClients = hasPropClients ? initialClientsList : queriedClients;
  // Présélection de la première cliente : une seule fois, et seulement si rien
  // n'est déjà choisi (commande existante, cliente présélectionnée ou fournie).
  const hasDefaultClientRef = useRef(
    Boolean(order?.clientId || preselectedClientId || initialClient),
  );

  useEffect(() => {
    if (!sourceClients || sourceClients.length === 0) return;
    setClients(sourceClients);
    if (hasDefaultClientRef.current) return;
    hasDefaultClientRef.current = true;
    const [firstClient] = sourceClients;
    setSelectedClientId((current) => current || firstClient.id);
    if (firstClient.measurements) {
      setOrderMeasurements((current) =>
        Object.keys(current).length === 0 ? firstClient.measurements : current,
      );
    }
  }, [sourceClients]);

  if (!isOpen) return null;

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

  const handleQuickSaveClient = async (clientData: CreateClientDto) => {
    try {
      const payload = { ...clientData, id: clientData.id ?? uuidv4() };
      // Hors ligne, la cliente est mise en file et utilisable immédiatement.
      const { result: created } = await runOrQueue(
        'CREATE_CLIENT',
        payload,
        () => api.createClient(payload),
        () => buildOptimisticClient(payload),
      );
      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);
      if (created.measurements && Object.keys(created.measurements).length > 0) {
        setOrderMeasurements(created.measurements);
      }
      setIsQuickClientModalOpen(false);
      toast.success(`Cliente ${created.fullName} ajoutée avec succès ✨`);
    } catch (err: unknown) {
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, 'Erreur lors de la création de la cliente'));
    }
  };

  const handleSaveMeasurementsFromModal = async (
    updatedMeasurements: Measurements,
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
      const payload: CreateOrderDto = {
        id: draftIds.id,
        clientMutationId: draftIds.clientMutationId,
        clientId: selectedClientId,
        modelName,
        fabricPhotoUrl: fabricPhotoUrl || undefined,
        totalAmount: Number(totalAmount),
        depositAmount: depositAmount ? Number(depositAmount) : 0,
        paymentMethod,
        fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
        deliveryDeadline: new Date(deliveryDeadline).toISOString(),
        measurementSnapshot: orderMeasurements || {},
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else if (onSave) {
        await onSave(payload);
      }
      onClose();
    } catch (err: unknown) {
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, 'Erreur lors de la création de la commande'));
    } finally {
      setLoading(false);
    }
  };

  const currentClient = clients.find((c) => c.id === selectedClientId) || initialClient;
  const measurementKeys = Object.keys(orderMeasurements || {}).filter(
    (k) => orderMeasurements[k] !== '' && orderMeasurements[k] !== null && orderMeasurements[k] !== undefined,
  );

  const isSubmitting = loading || externalLoading;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        {...dialogProps}
        className="bg-white border border-slate-200 w-full max-w-lg rounded-t-[1.75rem] sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm sm:text-base font-display font-bold text-slate-900">
                {order ? 'Modifier la Commande' : 'Nouvelle Commande'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Confection sur mesure & Acompte
              </p>
            </div>
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
          {/* Section 1: Client Selection */}
          <div className="space-y-1.5">
            <ClientPicker
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={handleSelectClientFromPicker}
              onQuickCreateClient={() => setIsQuickClientModalOpen(true)}
            />
          </div>

          {/* Section 2: Model & Fabric Photo */}
          <div className="space-y-3">
            <div>
              <label htmlFor={`${fieldId}-model`} className="block text-xs font-bold text-slate-700 mb-1">
                Modèle à confectionner *
              </label>
              <input
                id={`${fieldId}-model`}
                type="text"
                required
                placeholder="Ex: Grand Boubou Brodé 3 pièces, Robe Marinière..."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 transition font-medium"
              />
            </div>

            <PhotoCaptureInput
              label="Photo du tissu ou modèle"
              value={fabricPhotoUrl}
              onChange={setFabricPhotoUrl}
            />
          </div>

          {/* Section 3: Measurements Snapshot */}
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <Ruler className="w-4 h-4 text-amber-500" />
                <span>Mesures pour cette tenue</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMeasurementModalOpen(true)}
                className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
              >
                <span>{measurementKeys.length > 0 ? 'Modifier mesures' : 'Renseigner mesures'}</span>
              </button>
            </div>

            {measurementKeys.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                {measurementKeys.map((key) => (
                  <div
                    key={key}
                    className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-[11px] flex justify-between items-center"
                  >
                    <span className="text-slate-500 truncate max-w-[90px]">
                      {getMeasurementLabel(key)}
                    </span>
                    <strong className="text-slate-900 font-mono">
                      {orderMeasurements[key]} cm
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                {currentClient
                  ? 'Aucune mesure renseignée. Cliquez sur le bouton pour les ajouter.'
                  : 'Sélectionnez une cliente pour importer ses mesures.'}
              </p>
            )}
          </div>

          {/* Section 4: Price & Deposit */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${fieldId}-total`} className="block text-xs font-bold text-slate-700 mb-1">
                  Prix total (FCFA) *
                </label>
                <input
                  id={`${fieldId}-total`}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  min="100"
                  step="100"
                  placeholder="Ex: 25000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-deposit`} className="block text-xs font-bold text-slate-700 mb-1">
                  Acompte versé (FCFA)
                </label>
                <input
                  id={`${fieldId}-deposit`}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Quick deposit buttons */}
            {totalAmount && Number(totalAmount) > 0 && (
              <div className="flex gap-1.5">
                <span className="text-[10px] text-slate-400 self-center mr-1">Raccourcis :</span>
                {[0.3, 0.5, 0.7, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetDepositPercentage(pct)}
                    className="px-2 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 rounded-lg text-[10px] font-bold transition"
                  >
                    {pct === 1 ? '100% (Soldé)' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            )}

            {/* Payment method for deposit */}
            {depositAmount && Number(depositAmount) > 0 && (
              <div className="space-y-1 animate-fade-in">
                <span id={`${fieldId}-method`} className="block text-[11px] font-bold text-slate-700">
                  Mode de règlement de l'acompte
                </span>
                <div role="group" aria-labelledby={`${fieldId}-method`} className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'CASH', label: 'Espèces' },
                    { key: 'WAVE', label: 'Wave' },
                    { key: 'ORANGE_MONEY', label: 'Orange Money' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key)}
                      aria-pressed={paymentMethod === m.key}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
                        paymentMethod === m.key
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Dates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor={`${fieldId}-fitting`} className="block text-xs font-bold text-slate-700 mb-1">
                Date d'essayage
              </label>
              <input
                id={`${fieldId}-fitting`}
                type="date"
                value={fittingDate}
                onChange={(e) => setFittingDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-delivery`} className="block text-xs font-bold text-slate-700 mb-1">
                Date de livraison *
              </label>
              <input
                id={`${fieldId}-delivery`}
                type="date"
                required
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 text-xs sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la Commande</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Child Modals */}
        {isQuickClientModalOpen && (
          <ClientModal
            isOpen={isQuickClientModalOpen}
            onClose={() => setIsQuickClientModalOpen(false)}
            onSubmit={handleQuickSaveClient}
          />
        )}

        {isMeasurementModalOpen && (
          <MeasurementDrawerModal
            isOpen={isMeasurementModalOpen}
            initialMeasurements={orderMeasurements}
            clientName={currentClient?.fullName || 'la cliente'}
            onClose={() => setIsMeasurementModalOpen(false)}
            onSave={handleSaveMeasurementsFromModal}
          />
        )}
      </div>
    </div>
  );
};
