import React, { useEffect, useState } from 'react';
import { Client } from '@types';
import { api } from '@services/api';
import { db } from '@db/db';
import {
  Users,
  Search,
  Plus,
  Phone,
  Ruler,
  MessageCircle,
  Scissors,
  Edit2,
} from 'lucide-react';
import { ClientModal } from '@screens/ClientModal';

interface ClientsScreenProps {
  isOnline: boolean;
  onNewOrderForClient?: (client: Client) => void;
  onClientChanged?: () => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  isOnline,
  onNewOrderForClient,
  onClientChanged,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const remote = await api.listClients(searchQuery);
        setClients(remote);
        for (const c of remote) {
          await db.clients.put({ ...c, isSynced: true });
        }
      } else {
        let local = await db.clients.toArray();
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          local = local.filter(
            (c) =>
              c.fullName.toLowerCase().includes(q) ||
              c.phone.toLowerCase().includes(q),
          );
        }
        setClients(local);
      }
    } catch (err) {
      console.warn('Fallback local clients:', err);
      const local = await db.clients.toArray();
      setClients(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [isOnline, searchQuery]);

  const handleSaveClient = async (clientData: any) => {
    const workshopId = localStorage.getItem('tailor_workshop_id') || '';

    const newClient: Client = {
      ...clientData,
      workshopId,
      createdAt: new Date().toISOString(),
      isSynced: false,
    };

    await db.clients.put(newClient);

    if (isOnline) {
      try {
        const remote = await api.createClient(clientData);
        await db.clients.put({ ...remote, isSynced: true });
      } catch (err) {
        await db.pendingMutations.add({
          id: `mut_${Date.now()}_${Math.random()}`,
          type: 'CREATE_CLIENT',
          payload: clientData,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
      }
    } else {
      await db.pendingMutations.add({
        id: `mut_${Date.now()}_${Math.random()}`,
        type: 'CREATE_CLIENT',
        payload: clientData,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
    }

    await loadClients();
    onClientChanged?.();
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;
    const text = encodeURIComponent(
      `Bonjour ${name}, j'espère que vous allez bien ! C'est votre atelier de couture.`,
    );
    window.open(`https://wa.me/${internationalPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-3.5 pb-safe max-w-md mx-auto px-4 pt-3.5">
      {/* Top Search & Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher cliente ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-sm text-slate-900 placeholder-slate-400"
          />
        </div>

        <button
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          type="button"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs font-medium">
          Chargement...
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Aucune cliente enregistrée</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajoutez vos clientes pour enregistrer leurs mesures.
          </p>
          <button
            onClick={() => {
              setSelectedClient(null);
              setIsModalOpen(true);
            }}
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Ajouter une cliente
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {clients.map((c) => {
            const measurementCount = Object.keys(c.measurements || {}).length;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-3.5 space-y-3 border border-slate-200 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        c.gender === 'F'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {c.fullName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${c.phone}`}
                          className="text-xs text-slate-500 flex items-center gap-1 font-mono hover:text-amber-600 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      c.gender === 'F'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {c.gender === 'F' ? 'Femme' : 'Homme'}
                  </span>
                </div>

                {/* Measurements Pill */}
                <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Ruler className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {measurementCount > 0
                        ? `${measurementCount} mesure(s) enregistrée(s)`
                        : 'Pas de mesures'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClient(c);
                      setIsModalOpen(true);
                    }}
                    type="button"
                    className="text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Modifier</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => openWhatsApp(c.phone, c.fullName)}
                    type="button"
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {onNewOrderForClient && (
                    <button
                      onClick={() => onNewOrderForClient(c)}
                      type="button"
                      className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Commander</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Modal */}
      {isModalOpen && (
        <ClientModal
          client={selectedClient}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
};

