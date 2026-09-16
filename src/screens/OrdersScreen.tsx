import React, { useEffect, useState } from 'react';
import { Order } from '@types';
import { api } from '@services/api';
import { db } from '@db/db';
import {
  ShoppingBag,
  Search,
  Plus,
  Calendar,
  Wallet,
  MessageCircle,
  Scissors,
  ArrowRight,
  Ruler,
} from 'lucide-react';
import { OrderModal } from '@screens/OrderModal';
import { OrderStatusBadge } from '@components/OrderStatusBadge';
import { MeasurementDrawerModal } from '@components/MeasurementDrawerModal';
import { toast } from '@services/toast';

interface OrdersScreenProps {
  isOnline: boolean;
  onRecordPaymentForOrder?: (order: Order) => void;
  onOrderChanged?: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  isOnline,
  onRecordPaymentForOrder,
  onOrderChanged,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFabricPreview, setSelectedFabricPreview] = useState<string | null>(null);
  const [selectedOrderForMeasurements, setSelectedOrderForMeasurements] = useState<Order | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const remote = await api.listOrders(
          statusFilter !== 'ALL' ? statusFilter : undefined,
        );
        setOrders(remote);
        for (const o of remote) {
          await db.orders.put({ ...o, isSynced: true });
        }
      } else {
        let local = await db.orders.toArray();
        if (statusFilter !== 'ALL') {
          local = local.filter((o) => o.status === statusFilter);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          local = local.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.modelName.toLowerCase().includes(q) ||
              o.client?.fullName.toLowerCase().includes(q),
          );
        }
        setOrders(local);
      }
    } catch (err) {
      console.warn('Fallback local orders:', err);
      const local = await db.orders.toArray();
      setOrders(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isOnline, statusFilter, searchQuery]);

  const handleCreateOrder = async (orderData: any) => {
    const workshopId = localStorage.getItem('tailor_workshop_id') || '';
    const deposit = Number(orderData.depositAmount) || 0;
    const total = Number(orderData.totalAmount) || 0;

    const localOrder: Order = {
      ...orderData,
      workshopId,
      orderNumber: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'EN_COURS',
      totalPaid: deposit,
      remainingBalance: Math.max(0, total - deposit),
      createdAt: new Date().toISOString(),
      isSynced: false,
    };

    await db.orders.put(localOrder);

    if (deposit > 0) {
      await db.payments.put({
        id: `pay_${Date.now()}`,
        workshopId,
        orderId: localOrder.id,
        clientMutationId: orderData.clientMutationId
          ? `dep_${orderData.clientMutationId}`
          : `dep_${Date.now()}`,
        amount: deposit,
        method: orderData.paymentMethod || 'CASH',
        channel: 'ORDER_DEPOSIT',
        receiptNumber: `REC-PROV-${Math.floor(1000 + Math.random() * 9000)}`,
        paidAt: new Date().toISOString(),
        isSynced: false,
      });
    }

    if (isOnline) {
      try {
        const remote = await api.createOrder(orderData);
        await db.orders.update(orderData.id, {
          ...remote,
          orderNumber: remote.orderNumber,
          isSynced: true,
        });
        toast.success(`Commande #${remote.orderNumber || ''} créée avec succès ✨`);
      } catch (e) {
        await db.pendingMutations.add({
          id: `mut_${Date.now()}_${Math.random()}`,
          type: 'CREATE_ORDER',
          payload: orderData,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
        toast.info('Commande enregistrée localement (en attente de synchronisation).');
      }
    } else {
      await db.pendingMutations.add({
        id: `mut_${Date.now()}_${Math.random()}`,
        type: 'CREATE_ORDER',
        payload: orderData,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
      toast.success('Commande enregistrée en mode hors-ligne.');
    }

    await loadOrders();
    onOrderChanged?.();
  };

  const handleUpdateStatus = async (order: Order, nextStatus: string) => {
    try {
      const statusLabels: Record<string, string> = {
        EN_COURS: 'en cours de coupe / confection ✂️',
        TERMINE: 'prête / terminée ✨',
        LIVRE: 'livrée au client 📦',
        ANNULE: 'annulée ❌',
      };
      const label = statusLabels[nextStatus] || nextStatus;

      // Optimistic local update in IndexedDB
      await db.orders.update(order.id, {
        status: nextStatus as any,
        isSynced: false,
      });
      await loadOrders();
      onOrderChanged?.();

      if (isOnline) {
        try {
          await api.updateOrderStatus(order.id, nextStatus);
          await db.orders.update(order.id, { isSynced: true });
          toast.success(`Commande #${order.orderNumber} : ${label}`);
        } catch (e: any) {
          await db.pendingMutations.add({
            id: `mut_${Date.now()}_${Math.random()}`,
            type: 'UPDATE_ORDER_STATUS',
            payload: { id: order.id, status: nextStatus },
            createdAt: new Date().toISOString(),
            retryCount: 0,
          });
          toast.info(`Statut enregistré localement (en attente de synchronisation).`);
        }
      } else {
        await db.pendingMutations.add({
          id: `mut_${Date.now()}_${Math.random()}`,
          type: 'UPDATE_ORDER_STATUS',
          payload: { id: order.id, status: nextStatus },
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
        toast.success(`Commande #${order.orderNumber} : ${label} (hors-ligne)`);
      }
      onOrderChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement de statut');
    }
  };

  const sendWhatsAppUpdate = (order: Order) => {
    const clientPhone = order.client?.phone || '';
    if (!clientPhone) {
      toast.warning('Numéro client non renseigné');
      return;
    }
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;

    let msg = `Bonjour ${order.client?.fullName || ''}, votre commande *${order.modelName}* (#${order.orderNumber}) `;
    if (order.status === 'TERMINE') {
      msg += `est *prête* à l'atelier ! ✨`;
      if ((order.remainingBalance || 0) > 0) {
        msg += ` Reliquat à régler : ${formatMoney(order.remainingBalance || 0)}.`;
      }
    } else if (order.status === 'LIVRE') {
      msg += `vous a bien été livrée. Merci de votre confiance chez *Sama Waay* ! ✂️`;
    } else if (order.status === 'ANNULE') {
      msg += `a été annulée.`;
    } else {
      msg += `est en cours de confection. Date de livraison prévue : ${formatDate(order.deliveryDeadline)}.`;
    }

    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getNextStatus = (current: string) => {
    switch (current) {
      case 'EN_COURS':
      case 'DRAFT':
      case 'CUTTING':
      case 'SEWING':
        return { next: 'TERMINE', label: 'Marquer Prêt / Terminé' };
      case 'TERMINE':
      case 'FITTING_READY':
      case 'COMPLETED':
        return { next: 'LIVRE', label: 'Marquer Livré' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 pb-safe max-w-md mx-auto px-4 pt-3.5">
      {/* Search and Add Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-sm text-slate-900 placeholder-slate-400"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouvelle</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'ALL', label: 'Toutes' },
          { id: 'EN_COURS', label: 'En cours' },
          { id: 'TERMINE', label: 'Terminées' },
          { id: 'LIVRE', label: 'Livrées' },
          { id: 'ANNULE', label: 'Annulées' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs font-medium">
          Chargement...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Aucune commande</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Créez une commande pour suivre sa confection.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle commande
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const nextAction = getNextStatus(o.status);
            const isLate =
              new Date(o.deliveryDeadline) < new Date() &&
              o.status !== 'LIVRE' &&
              o.status !== 'ANNULE';

            return (
              <div
                key={o.id}
                className={`bg-white rounded-2xl p-4 space-y-3 border shadow-sm transition ${
                  isLate ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {o.fabricPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedFabricPreview(o.fabricPhotoUrl || null)}
                        className="shrink-0"
                        title="Voir tissu"
                      >
                        <img
                          src={o.fabricPhotoUrl}
                          alt="Tissu"
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                      </button>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {o.client?.fullName || 'Cliente'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{o.orderNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {o.modelName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <OrderStatusBadge status={o.status} size="sm" />
                  </div>
                </div>

                {/* Details Bar */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs border border-slate-100">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className={isLate ? 'text-rose-600 font-bold' : ''}>
                      {formatDate(o.deliveryDeadline)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {formatMoney(o.totalAmount)}
                    </span>
                    {(o.remainingBalance || 0) > 0 ? (
                      <span className="text-amber-700 font-semibold ml-1.5">
                        (Dû: {formatMoney(o.remainingBalance || 0)})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold ml-1.5">
                        ✓ Soldé
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-0.5">
                  {nextAction && (
                    <button
                      onClick={() => handleUpdateStatus(o, nextAction.next)}
                      type="button"
                      className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs border ${
                        nextAction.next === 'TERMINE'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400'
                      }`}
                    >
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onRecordPaymentForOrder && (o.remainingBalance || 0) > 0 && (
                    <button
                      onClick={() => onRecordPaymentForOrder(o)}
                      type="button"
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 transition active:scale-95"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Encaisser</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrderForMeasurements(o)}
                    type="button"
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 p-2 rounded-xl transition active:scale-95"
                    title="Voir les mesures de coupe"
                  >
                    <Ruler className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendWhatsAppUpdate(o)}
                    type="button"
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 p-2 rounded-xl transition active:scale-95"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fabric Zoom Modal */}
      {selectedFabricPreview && (
        <div
          onClick={() => setSelectedFabricPreview(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="max-w-md w-full bg-white p-3 rounded-2xl shadow-xl">
            <img
              src={selectedFabricPreview}
              alt="Aperçu tissu"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-500 mt-2 font-medium">
              Touchez pour fermer
            </p>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateOrder}
        />
      )}

      {/* Order Measurements Drawer Modal */}
      {selectedOrderForMeasurements && (
        <MeasurementDrawerModal
          isOpen={Boolean(selectedOrderForMeasurements)}
          onClose={() => setSelectedOrderForMeasurements(null)}
          clientName={selectedOrderForMeasurements.client?.fullName}
          modelName={selectedOrderForMeasurements.modelName}
          measurements={selectedOrderForMeasurements.measurementSnapshot || {}}
          isReadOnly={true}
        />
      )}
    </div>
  );
};

