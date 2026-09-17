import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@services/api/client.service';
import { CreateClientDto, UpdateClientDto } from '@types';
import { toast } from '@services/toast';

export const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  list: (search?: string) => ['clients', { search }] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};

export function useClientsQuery(searchQuery?: string) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.list(searchQuery),
    queryFn: async () => {
      const clients = await clientService.listClients(searchQuery);
      const list = Array.isArray(clients) ? clients : [];
      return list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    },
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
    mutationFn: (data: CreateClientDto) => clientService.createClient(data),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_QUERY_KEYS.all });
      toast.success(`Cliente ${newClient.fullName} enregistrée avec succès ✨`);
    },
    onError: (err: any) => {
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
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la mise à jour de la cliente');
    },
  });
}
