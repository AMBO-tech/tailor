import React, { useEffect, useState } from 'react';
import { Client } from '../types';
import { api } from '../services/api';
import { db } from '../db/db';
import {
  Users,
  Search,
  Plus,
  Phone,
  Ruler,
  MessageSquare,
  Edit2,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ClientModal } from './ClientModal';

interface ClientsScreenProps {
  isOnline: boolean;
  onNewOrderForClient?: (client: Client) => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ isOnline, onNewOrderForClient }) => {
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
        // Cache to local DB
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

    // Save locally in IndexedDB first (Offline-First)
    await db.clients.put(newClient);

    if (isOnline) {
      try {
        const remote = await api.createClient(clientData);
        await db.clients.put({ ...remote, isSynced: true });
      } catch (err) {
        console.warn('Error saving client online, queued mutation:', err);
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

    loadClients();
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
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
          />
        </div>

        <button
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau Client</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Chargement des fiches clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Aucun client trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            Ajoutez vos clientes et enregistrez leurs mesures pour ne plus jamais perdre un carnet.
          </p>
          <button
            onClick={() => {
              setSelectedClient(null);
              setIsModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
          >
            <Plus className="w-4 h-4" /> Ajouter le premier client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clients.map((c) => {
            const measurementCount = Object.keys(c.measurements || {}).length;

            return (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        c.gender === 'F'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {c.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-100 truncate">
                        {c.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {c.phone}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      c.gender === 'F'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-sky-950 text-sky-300 border-sky-800'
                    }`}
                  >
                    {c.gender === 'F' ? 'Femme' : 'Homme'}
                  </span>
                </div>

                {/* Measurements overview */}
                <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    <span>{measurementCount} mesure(s) enregistrée(s)</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClient(c);
                      setIsModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Voir / Modifier
                  </button>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
                    "{c.notes}"
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openWhatsApp(c.phone, c.fullName)}
                    className="flex-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>

                  {onNewOrderForClient && (
                    <button
                      onClick={() => onNewOrderForClient(c)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" /> Commande
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
