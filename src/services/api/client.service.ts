import { request } from './apiClient';
import { Client, CreateClientDto, UpdateClientDto } from '@types';

export const clientService = {
  async listClients(searchQuery?: string): Promise<Client[]> {
    const url = searchQuery
      ? `/clients?q=${encodeURIComponent(searchQuery)}`
      : '/clients';
    return request<Client[]>(url);
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
