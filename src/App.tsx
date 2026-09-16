import React, { useEffect, useState } from 'react';
import { User, Workshop, Client, Order } from '@types';
import { Header } from '@components/Header';
import { BottomNav, TabType } from '@components/BottomNav';
import { OfflineBanner } from '@components/OfflineBanner';
import { AuthScreen } from '@screens/AuthScreen';
import { DashboardScreen } from '@screens/DashboardScreen';
import { OrdersScreen } from '@screens/OrdersScreen';
import { ClientsScreen } from '@screens/ClientsScreen';
import { PaymentsScreen } from '@screens/PaymentsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ClientModal } from '@screens/ClientModal';
import { OrderModal } from '@screens/OrderModal';
import { PaymentModal } from '@screens/PaymentModal';
import { db } from '@db/db';
import { syncPendingMutations } from '@services/sync';
import { api } from '@services/api';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('tailor_token'),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tailor_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [workshops, setWorkshops] = useState<Workshop[]>(() => {
    const saved = localStorage.getItem('tailor_workshops');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentWorkshop, setCurrentWorkshop] = useState<Workshop | null>(() => {
    const saved = localStorage.getItem('tailor_workshop');
    return saved ? JSON.parse(saved) : workshops[0] || null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [urgentCount, setUrgentCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshData = () => {
    setDataVersion((v) => v + 1);
    updateStats();
  };

  // Global modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [initialClientForOrder, setInitialClientForOrder] = useState<Client | null>(
    null,
  );
  const [initialOrderForPayment, setInitialOrderForPayment] = useState<Order | null>(
    null,
  );

  const updateStats = async () => {
    try {
      const pCount = await db.pendingMutations.count();
      setPendingCount(pCount);

      const now = new Date();
      const next48h = new Date(now.getTime() + 48 * 3600 * 1000);
      const activeOrders = await db.orders
        .filter((o) => o.status !== 'LIVRE' && o.status !== 'ANNULE')
        .toArray();

      const urgents = activeOrders.filter((o) => {
        const deadline = new Date(o.deliveryDeadline);
        return deadline <= next48h;
      });
      setUrgentCount(urgents.length);
    } catch (e) {
      console.warn('Error updating local stats:', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingMutations();
      await updateStats();
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = (data: {
    user: any;
    token?: string;
    accessToken?: string;
    workshops: any[];
  }) => {
    const activeToken = data.token || data.accessToken || '';
    setToken(activeToken);
    setUser(data.user);
    setWorkshops(data.workshops || []);
    const initialWorkshop = data.workshops?.[0] || null;
    setCurrentWorkshop(initialWorkshop);

    if (activeToken) {
      localStorage.setItem('tailor_token', activeToken);
    }
    if (data.user) {
      localStorage.setItem('tailor_user', JSON.stringify(data.user));
    }
    if (data.workshops) {
      localStorage.setItem('tailor_workshops', JSON.stringify(data.workshops));
    }
    if (initialWorkshop) {
      localStorage.setItem('tailor_workshop', JSON.stringify(initialWorkshop));
      localStorage.setItem('tailor_workshop_id', initialWorkshop.workshopId);
    }
  };

  const handleSelectWorkshop = (ws: Workshop) => {
    setCurrentWorkshop(ws);
    localStorage.setItem('tailor_workshop', JSON.stringify(ws));
    localStorage.setItem('tailor_workshop_id', ws.workshopId);
  };

  const handleLogout = () => {
    localStorage.removeItem('tailor_token');
    localStorage.removeItem('tailor_user');
    localStorage.removeItem('tailor_workshops');
    localStorage.removeItem('tailor_workshop');
    localStorage.removeItem('tailor_workshop_id');
    setToken(null);
    setUser(null);
    setWorkshops([]);
    setCurrentWorkshop(null);
  };

  // If not authenticated, show AuthScreen
  if (!token) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Header */}
      <Header
        user={user}
        currentWorkshop={currentWorkshop}
        workshops={workshops}
        onSelectWorkshop={handleSelectWorkshop}
        onLogout={handleLogout}
        isOnline={isOnline}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* Offline Status & Pending mutations banner */}
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            isOnline={isOnline}
            dataVersion={dataVersion}
            onNavigate={(tab) => setActiveTab(tab)}
            onNewOrder={() => setIsOrderModalOpen(true)}
            onNewClient={() => setIsClientModalOpen(true)}
            onNewPayment={() => setIsPaymentModalOpen(true)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersScreen
            isOnline={isOnline}
            onRecordPaymentForOrder={(order) => {
              setInitialOrderForPayment(order);
              setActiveTab('payments');
            }}
            onOrderChanged={refreshData}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsScreen
            isOnline={isOnline}
            onNewOrderForClient={(client) => {
              setInitialClientForOrder(client);
              setIsOrderModalOpen(true);
            }}
            onClientChanged={refreshData}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsScreen
            isOnline={isOnline}
            initialOrderForPayment={initialOrderForPayment}
            onClearInitialOrder={() => setInitialOrderForPayment(null)}
            onPaymentChanged={refreshData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            workshop={currentWorkshop}
            user={user}
            isOnline={isOnline}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Navigation Floating Dock */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          refreshData();
        }}
        urgentCount={urgentCount}
      />

      {/* Global Modals triggered from Dashboard */}
      {isClientModalOpen && (
        <ClientModal
          onClose={() => setIsClientModalOpen(false)}
          onSave={async (clientData) => {
            const workshopId = localStorage.getItem('tailor_workshop_id') || '';
            await db.clients.put({
              ...clientData,
              workshopId,
              createdAt: new Date().toISOString(),
              isSynced: false,
            });
            if (isOnline) {
              try {
                const res = await api.createClient(clientData);
                await db.clients.put({ ...res, isSynced: true });
              } catch (e) {
                await db.pendingMutations.add({
                  id: `mut_${Date.now()}`,
                  type: 'CREATE_CLIENT',
                  payload: clientData,
                  createdAt: new Date().toISOString(),
                  retryCount: 0,
                });
              }
            } else {
              await db.pendingMutations.add({
                id: `mut_${Date.now()}`,
                type: 'CREATE_CLIENT',
                payload: clientData,
                createdAt: new Date().toISOString(),
                retryCount: 0,
              });
            }
            refreshData();
          }}
        />
      )}

      {isOrderModalOpen && (
        <OrderModal
          initialClient={initialClientForOrder}
          onClose={() => {
            setIsOrderModalOpen(false);
            setInitialClientForOrder(null);
          }}
          onSave={async (orderData) => {
            const workshopId = localStorage.getItem('tailor_workshop_id') || '';
            const deposit = Number(orderData.depositAmount) || 0;
            const total = Number(orderData.totalAmount) || 0;
            const localOrder: Order = {
              ...orderData,
              workshopId,
              orderNumber: `PROV-${Math.floor(1000 + Math.random() * 9000)}`,
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
                const res = await api.createOrder(orderData);
                await db.orders.put({ ...res, isSynced: true });
              } catch (e) {
                await db.pendingMutations.add({
                  id: `mut_${Date.now()}`,
                  type: 'CREATE_ORDER',
                  payload: orderData,
                  createdAt: new Date().toISOString(),
                  retryCount: 0,
                });
              }
            } else {
              await db.pendingMutations.add({
                id: `mut_${Date.now()}`,
                type: 'CREATE_ORDER',
                payload: orderData,
                createdAt: new Date().toISOString(),
                retryCount: 0,
              });
            }
            refreshData();
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSave={async (paymentData) => {
            const workshopId = localStorage.getItem('tailor_workshop_id') || '';
            const numericAmount = Number(paymentData.amount) || 0;
            const localEntry = {
              ...paymentData,
              amount: numericAmount,
              workshopId,
              receiptNumber: `REC-PROV-${Math.floor(1000 + Math.random() * 9000)}`,
              paidAt: new Date().toISOString(),
              isSynced: false,
            };
            await db.payments.put(localEntry);

            if (paymentData.orderId) {
              const order = await db.orders.get(paymentData.orderId);
              if (order) {
                const currentPaid = Number(order.totalPaid) || 0;
                const totalOrderAmt = Number(order.totalAmount) || 0;
                const newPaid = currentPaid + numericAmount;
                const newRemaining = Math.max(0, totalOrderAmt - newPaid);
                await db.orders.update(paymentData.orderId, {
                  totalPaid: newPaid,
                  remainingBalance: newRemaining,
                });
              }
            }

            let remoteRes = null;
            if (isOnline) {
              try {
                remoteRes = await api.recordPayment({
                  ...paymentData,
                  amount: numericAmount,
                });
                await db.payments.put({
                  ...localEntry,
                  receiptNumber: remoteRes.receiptNumber,
                  isSynced: true,
                });
              } catch (e) {
                await db.pendingMutations.add({
                  id: `mut_${Date.now()}`,
                  type: 'RECORD_PAYMENT',
                  payload: {
                    ...paymentData,
                    amount: numericAmount,
                  },
                  createdAt: new Date().toISOString(),
                  retryCount: 0,
                });
              }
            } else {
              await db.pendingMutations.add({
                id: `mut_${Date.now()}`,
                type: 'RECORD_PAYMENT',
                payload: {
                  ...paymentData,
                  amount: numericAmount,
                },
                createdAt: new Date().toISOString(),
                retryCount: 0,
              });
            }
            refreshData();
            return remoteRes;
          }}
        />
      )}
    </div>
  );
};

