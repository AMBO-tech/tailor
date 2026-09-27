import { request } from './apiClient';
import { Client, CreateClientDto, UpdateClientDto, CursorPage } from '@types';
import { buildPageUrl, toCursorPage } from './pagination';

export const clientService = {
  async listClients(searchQuery?: string): Promise<Client[]> {
    const url = searchQuery
      ? `/clients?q=${encodeURIComponent(searchQuery)}`
      : '/clients';
    return request<Client[]>(url);
  },

  /** Page de clientes (`?limit=30&cursor=`), recherche `q` conservée. */
  async listClientsPage(searchQuery?: string, cursor?: string): Promise<CursorPage<Client>> {
    return toCursorPage(
      await request<Client[] | CursorPage<Client>>(buildPageUrl('/clients', { q: searchQuery?.trim() }, cursor)),
    );
  },

  async getClientById(id: string): Promise<Client> {
    return request<Client>(`/clients/${id}`);
  },

  async createClient(data: CreateClientDto): Promise<Client> {
    return request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    return request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
