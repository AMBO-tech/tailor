import React, { useState } from 'react';
import { Order, OrderStatus } from '@types';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  Calendar,
  Wallet,
  MessageCircle,
  Scissors,
  ArrowRight,
  Ruler,
  XCircle,
} from 'lucide-react';
import { ConfirmModal } from '@components/common/ConfirmModal';

export interface OrderCardProps {
  order: Order;
  onUpdateStatus: (order: Order, nextStatus: OrderStatus | string) => void;
  onRecordPayment: (order: Order) => void;
  onViewFabric?: (url: string) => void;
  onPreviewFabric?: (url: string) => void;
  onViewMeasurements: (order: Order) => void;
  onSendWhatsApp?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onRecordPayment,
  onViewFabric,
  onPreviewFabric,
  onViewMeasurements,
  onSendWhatsApp,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const totalAmount = Number(order.totalAmount) || 0;
  const totalPaid = Number(order.totalPaid) || 0;
  const remainingBalance =
    order.remainingBalance !== undefined
      ? Number(order.remainingBalance)
      : Math.max(0, totalAmount - totalPaid);

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

  const isUrgent = () => {
    if (order.status === 'LIVRE' || order.status === 'ANNULE') return false;
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 3600 * 1000);
    const deadline = new Date(order.deliveryDeadline);
    return deadline <= next48h;
  };

  const handleFabricClick = () => {
    if (order.fabricPhotoUrl) {
      if (onPreviewFabric) onPreviewFabric(order.fabricPhotoUrl);
      else if (onViewFabric) onViewFabric(order.fabricPhotoUrl);
    }
  };

  const handleWhatsApp = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp(order);
    } else {
      const clientPhone = order.client?.phone || '';
      if (!clientPhone) return;

      const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
      const internationalPhone = cleanPhone.startsWith('221')
        ? cleanPhone
        : `221${cleanPhone}`;

      let msg = `Bonjour ${order.client?.fullName || ''}, votre commande *${order.modelName}* (#${order.orderNumber}) `;
      if (order.status === 'TERMINE') {
        msg += `est *prête* à l'atelier ! ✨`;
        if (remainingBalance > 0) {
          msg += ` Reliquat à régler : ${formatMoney(remainingBalance)}.`;
        }
      } else if (order.status === 'EN_COURS') {
        msg += `est en cours de coupe et de couture ✂️.`;
      } else if (order.status === 'LIVRE') {
        msg += `vous a été bien livrée. Merci de votre confiance ! 🇸🇳`;
      }

      window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 border transition duration-200 shadow-2xs space-y-3.5 ${
        isUrgent()
          ? 'border-rose-300 ring-2 ring-rose-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header: Title, Order#, Fabric Photo, Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {order.fabricPhotoUrl ? (
            <button
              onClick={handleFabricClick}
              type="button"
              className="relative group shrink-0"
              title="Voir la photo du tissu"
            >
              <img
                src={order.fabricPhotoUrl}
                alt="Tissu"
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition"
              />
              <span className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-[10px] font-bold">
                🔍
              </span>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
              <Scissors className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm text-slate-900 truncate leading-snug">
              {order.modelName}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              #{order.orderNumber} •{' '}
              <strong className="text-slate-700 font-sans">
                {order.client?.fullName || 'Cliente'}
              </strong>
            </p>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress & Financial details */}
      <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-100">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500">
            Acompte versé :{' '}
            <strong className="text-emerald-700 font-bold">
              {formatMoney(totalPaid)}
            </strong>
          </span>
          <span className="text-slate-700 font-bold">
            Total : {formatMoney(totalAmount)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              remainingBalance === 0 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{
              width: `${totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0}%`,
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] pt-0.5">
          <span className="text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Livraison :{' '}
            <strong
              className={`font-semibold ${
                isUrgent() ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {formatDate(order.deliveryDeadline)}
            </strong>
          </span>

          {remainingBalance > 0 ? (
            <span className="text-rose-600 font-bold">
              Reste : {formatMoney(remainingBalance)}
            </span>
          ) : (
            <span className="text-emerald-600 font-bold">Soldé ✨</span>
          )}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 text-xs">
        {/* Left actions: Measurements & WhatsApp */}
        <div className="flex items-center gap-1">
          {order.measurementSnapshot && Object.keys(order.measurementSnapshot).length > 0 && (
            <button
              onClick={() => onViewMeasurements(order)}
              type="button"
              className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition active:scale-95"
              title="Consulter les mesures"
              aria-label="Consulter les mesures"
            >
              <Ruler className="w-4 h-4" />
            </button>
          )}

          {order.client?.phone && (
            <button
              onClick={handleWhatsApp}
              type="button"
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition active:scale-95"
              title="Envoyer point sur WhatsApp"
              aria-label="Envoyer point sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          {order.status === 'EN_COURS' && (
            <button
              onClick={() => setShowCancelModal(true)}
              type="button"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95"
              title="Annuler la commande"
              aria-label="Annuler la commande"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right actions: Status progression or Payment */}
        <div className="flex items-center gap-1.5">
          {remainingBalance > 0 && (
            <button
              onClick={() => onRecordPayment(order)}
              type="button"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition active:scale-95 border border-emerald-200/80"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Encaisser</span>
            </button>
          )}

          {order.status === 'EN_COURS' && (
            <button
              onClick={() => onUpdateStatus(order, 'TERMINE')}
              type="button"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition active:scale-95 shadow-2xs"
            >
              <span>Terminer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {order.status === 'TERMINE' && (
            <button
              onClick={() => onUpdateStatus(order, 'LIVRE')}
              type="button"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition active:scale-95"
            >
              <span>Livrer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal pour Annulation de Commande */}
      {showCancelModal && (
        <ConfirmModal
          isOpen={showCancelModal}
          title="Annuler la commande"
          message={`Êtes-vous sûr de vouloir annuler la commande #${order.orderNumber} (${order.modelName}) pour ${order.client?.fullName || 'la cliente'} ?`}
          confirmLabel="Confirmer l'annulation"
          cancelLabel="Retour"
          variant="danger"
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            onUpdateStatus(order, 'ANNULE');
            setShowCancelModal(false);
          }}
        />
      )}
    </div>
  );
};
