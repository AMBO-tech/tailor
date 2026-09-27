import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedList } from './usePagedList';
import { clientService } from '@services/api/client.service';
import { v4 as uuidv4 } from 'uuid';
import { Client, CreateClientDto, UpdateClientDto } from '@types';
import { buildOptimisticClient, mergePendingClients, runOrQueue } from '@services/offlineQueue';
import { isQueuedEntity, notifyQueued, prependToCachedLists } from './offlineCache';
import { toast } from '@services/toast';
import { markErrorNotified } from '@utils/errors';
import { getActiveWorkshopId } from '@utils/storage';

/** Clés du cache des clientes (`all` = préfixe d'invalidation, ARC-1 : atelier inclus). */
export const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  list: (search?: string) => ['clients', getActiveWorkshopId(), { search }] as const,
  /** Liste paginée de l'écran Clientes (« Charger plus »). */
  pages: (search?: string) => ['clients', getActiveWorkshopId(), 'pages', { search }] as const,
  detail: (id: string) => ['clients', getActiveWorkshopId(), 'detail', id] as const,
};

export interface ClientsQueryOptions {
  /** Permet de ne pas charger la liste quand l'appelant la possède déjà. */
  enabled?: boolean;
}

/** Filtre local (nom / téléphone) appliqué aux clientes en attente de synchronisation. */
function matchesSearch(list: Client[], searchQuery?: string): Client[] {
  const q = searchQuery?.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) => c.isSynced !== false || c.fullName.toLowerCase().includes(q) || c.phone.includes(q),
  );
}

export function useClientsQuery(searchQuery?: string, options: ClientsQueryOptions = {}) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.list(searchQuery),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const clients = await clientService.listClients(searchQuery);
      // Les clientes créées hors ligne restent visibles jusqu'à leur synchronisation.
      const list = matchesSearch(
        await mergePendingClients(Array.isArray(clients) ? clients : []),
        searchQuery,
      );
      return list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    },
  });
}

/**
 * Clientes de l'écran Clientes, par pages de 30 (`?limit=30&cursor=`), avec la
 * recherche serveur `q`. La 1re page inclut les clientes créées hors ligne.
 */
export function useClientPagesQuery(searchQuery?: string) {
  return usePagedList<Client>({
    queryKey: CLIENT_QUERY_KEYS.pages(searchQuery),
    fetchPage: (cursor) => clientService.listClientsPage(searchQuery, cursor),
    transformPage: async (clients, isFirstPage) =>
      isFirstPage ? matchesSearch(await mergePendingClients(clients), searchQuery) : clients,
  });
}

export function useClientQuery(id?: string) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.detail(id || ''),
    queryFn: () => clientService.getClientById(id!),
    enabled: !!id,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // 'always' : la mutation s'exécute aussi hors ligne (elle est alors mise en file).
    networkMode: 'always',
    mutationFn: async (data: CreateClientDto) => {
      const payload = { ...data, id: data.id ?? uuidv4() };
      const { result } = await runOrQueue(
        'CREATE_CLIENT',
        payload,
        () => clientService.createClient(payload),
        () => buildOptimisticClient(payload),
      );
      return result;
    },
    onSuccess: (newClient) => {
      if (isQueuedEntity(newClient)) {
        prependToCachedLists(queryClient, CLIENT_QUERY_KEYS.all, newClient);
        notifyQueued();
        return;
      }
      queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.all });
      toast.success(`Cliente ${newClient.fullName} enregistrée avec succès ✨`);
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || "Erreur lors de l'enregistrement de la cliente");
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientService.updateClient(id, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.all });
      toast.success(`Fiche de ${updatedClient.fullName} mise à jour ✨`);
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || 'Erreur lors de la mise à jour de la cliente');
    },
  });
}
