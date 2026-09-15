import React, { useEffect, useState } from 'react';
import { Order, Client } from '../types';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  ShoppingBag,
  Search,
  Plus,
  Calendar,
  Wallet,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { OrderModal } from './OrderModal';

interface OrdersScreenProps {
  isOnline: boolean;
  onRecordPaymentForOrder?: (order: Order) => void;
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'En attente', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  CUTTING: { label: 'En Coupe', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  SEWING: { label: 'En Couture', color: 'bg-sky-950 text-sky-300 border-sky-800' },
  FITTING_READY: { label: 'Prêt Essayage', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  COMPLETED: { label: 'Prêt Livraison', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  DELIVERED: { label: 'Livré & Clôturé', color: 'bg-slate-900 text-slate-500 border-slate-800' },
};

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  isOnline,
  onRecordPaymentForOrder,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const remote = await api.listOrders(
          statusFilter !== 'ALL' ? statusFilter : undefined,
        );
        setOrders(remote);
        // Cache in Dexie
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

    // Create temporary local order
    const localOrder: Order = {
      ...orderData,
      workshopId,
      orderNumber: `PROV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'DRAFT',
      totalPaid: orderData.depositAmount || 0,
      remainingBalance: (orderData.totalAmount || 0) - (orderData.depositAmount || 0),
      createdAt: new Date().toISOString(),
      isSynced: false,
    };

    await db.orders.put(localOrder);

    if (isOnline) {
      try {
        const remote = await api.createOrder(orderData);
        await db.orders.put({ ...remote, isSynced: true });
      } catch (err) {
        console.warn('Queued order creation mutation:', err);
        await db.pendingMutations.add({
          id: `mut_${Date.now()}_${Math.random()}`,
          type: 'CREATE_ORDER',
          payload: orderData,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
      }
    } else {
      await db.pendingMutations.add({
        id: `mut_${Date.now()}_${Math.random()}`,
        type: 'CREATE_ORDER',
        payload: orderData,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
    }

    loadOrders();
  };

  const handleUpdateStatus = async (order: Order, nextStatus: string) => {
    try {
      if (isOnline) {
        await api.updateOrderStatus(order.id, nextStatus);
      }
      await db.orders.update(order.id, {
        status: nextStatus as any,
        isSynced: isOnline,
      });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const sendWhatsAppUpdate = (order: Order) => {
    const clientPhone = order.client?.phone || '';
    if (!clientPhone) {
      alert('Numéro client non renseigné');
      return;
    }
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;

    let msg = `Bonjour ${order.client?.fullName || ''}, votre commande #${order.orderNumber} (${order.modelName}) `;
    if (order.status === 'FITTING_READY') {
      msg += `est prête pour votre essayage à l'atelier ! Merci de passer quand vous voulez.`;
    } else if (order.status === 'COMPLETED') {
      msg += `est prête et repassée ! Reliquat dû : ${formatMoney(order.remainingBalance || 0)}. Merci de votre confiance.`;
    } else {
      msg += `est actuellement en cours de confection dans notre atelier. Date de livraison prévue : ${formatDate(order.deliveryDeadline)}.`;
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
      case 'DRAFT':
        return { next: 'CUTTING', label: 'Passer en Coupe' };
      case 'CUTTING':
        return { next: 'SEWING', label: 'Passer en Couture' };
      case 'SEWING':
        return { next: 'FITTING_READY', label: 'Prêt Essayage' };
      case 'FITTING_READY':
        return { next: 'COMPLETED', label: 'Prêt Livraison' };
      case 'COMPLETED':
        return { next: 'DELIVERED', label: 'Marquer Livré' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="N° commande, client, modèle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle Commande</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'ALL', label: 'Toutes' },
          { id: 'CUTTING', label: 'Coupe' },
          { id: 'SEWING', label: 'Couture' },
          { id: 'FITTING_READY', label: 'Essayage' },
          { id: 'COMPLETED', label: 'Prêtes' },
          { id: 'DELIVERED', label: 'Livrées' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              statusFilter === tab.id
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Chargement des commandes...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Aucune commande trouvée</p>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrez les confections avec la photo du tissu et la date de livraison promise.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
          >
            <Plus className="w-4 h-4" /> Nouvelle commande
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const nextAction = getNextStatus(o.status);
            const statusConfig = ORDER_STATUS_LABELS[o.status] || {
              label: o.status,
              color: 'bg-slate-800 text-slate-300',
            };

            const isLate =
              new Date(o.deliveryDeadline) < new Date() && o.status !== 'DELIVERED';

            return (
              <div
                key={o.id}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition shadow-sm ${
                  isLate ? 'border-rose-800/80 bg-rose-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Number, Client & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {o.fabricPhotoUrl ? (
                      <img
                        src={o.fabricPhotoUrl}
                        alt="Tissu"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 shadow"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          #{o.orderNumber}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100 truncate">
                          {o.client?.fullName || 'Client'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        {o.modelName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Deadlines & Financials */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Livraison promise</span>
                    <div
                      className={`font-bold flex items-center gap-1 mt-0.5 ${
                        isLate ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(o.deliveryDeadline)}</span>
                      {isLate && <span className="text-[10px] text-rose-400">(En retard)</span>}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Prix / Reliquat</span>
                    <div className="mt-0.5">
                      <span className="font-bold text-slate-200">
                        {formatMoney(o.totalAmount)}
                      </span>
                      {(o.remainingBalance || 0) > 0 ? (
                        <span className="text-amber-400 font-bold ml-1.5">
                          (Reste: {formatMoney(o.remainingBalance || 0)})
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold ml-1.5">
                          ✓ Réglé
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex items-center gap-2 pt-1">
                  {nextAction && (
                    <button
                      onClick={() => handleUpdateStatus(o, nextAction.next)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onRecordPaymentForOrder && (o.remainingBalance || 0) > 0 && (
                    <button
                      onClick={() => onRecordPaymentForOrder(o)}
                      className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                      title="Encaisser un versement"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Encaisser
                    </button>
                  )}

                  <button
                    onClick={() => sendWhatsAppUpdate(o)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 p-2 rounded-xl transition"
                    title="Envoyer statut WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateOrder}
        />
      )}
    </div>
  );
};
