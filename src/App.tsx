import React, { useEffect, useState } from 'react';
import { User, Workshop, Client, Order } from '@types';
import { Header } from '@components/Header';
import { BottomNav, TabType } from '@components/BottomNav';
import { AuthScreen } from '@screens/AuthScreen';
import { DashboardScreen } from '@screens/DashboardScreen';
import { OrdersScreen } from '@screens/OrdersScreen';
import { ClientsScreen } from '@screens/ClientsScreen';
import { PaymentsScreen } from '@screens/PaymentsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ClientModal } from '@screens/ClientModal';
import { OrderModal } from '@screens/OrderModal';
import { PaymentModal } from '@screens/PaymentModal';
import { api } from '@services/api';

import { ToastContainer } from '@components/Toast';
import { toast } from '@services/toast';
import { checkServerHealth } from '@services/network';

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
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshData = () => {
    setDataVersion((v) => v + 1);
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

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      refreshData();
      toast.info('Données actualisées ✨');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkConnection = async () => {
      const isHealthy = await checkServerHealth();
      if (isMounted) {
        setIsOnline(isHealthy);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);

    const handleOnline = () => checkConnection();
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Connexion au serveur interrompue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', checkConnection);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', checkConnection);
    };
  }, []);

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
    return (
      <>
        <ToastContainer />
        <AuthScreen onSuccess={handleAuthSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      <ToastContainer />

      {/* Header */}
      <Header
        user={user}
        currentWorkshop={currentWorkshop}
        workshops={workshops}
        onSelectWorkshop={handleSelectWorkshop}
        onLogout={handleLogout}
        isOnline={isOnline}
        onSync={handleManualRefresh}
        isSyncing={isRefreshing}
      />

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
      />

      {/* Global Modals triggered from Dashboard */}
      {isClientModalOpen && (
        <ClientModal
          onClose={() => setIsClientModalOpen(false)}
          onSave={async (clientData) => {
            const res = await api.createClient(clientData);
            toast.success(`Cliente ${res.fullName || clientData.fullName} créée avec succès ✨`);
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
            const res = await api.createOrder(orderData);
            toast.success(`Commande #${res.orderNumber || ''} créée avec succès ✨`);
            refreshData();
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSave={async (paymentData) => {
            const numericAmount = Number(paymentData.amount) || 0;
            const res = await api.recordPayment({
              ...paymentData,
              amount: numericAmount,
            });
            toast.success(`Versement de ${new Intl.NumberFormat('fr-FR').format(numericAmount)} FCFA enregistré ✨`);
            refreshData();
            return res;
          }}
        />
      )}
    </div>
  );
};

