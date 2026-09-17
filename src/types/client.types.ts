export type Gender = 'M' | 'F';

export interface Client {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string;
  gender: Gender;
  notes?: string;
  measurements: Record<string, number | string>;
  createdAt: string;
  updatedAt?: string;
  isSynced?: boolean;
}

export interface CreateClientDto {
  id?: string;
  fullName: string;
  phone: string;
  gender: Gender;
  notes?: string;
  measurements?: Record<string, any>;
}

export interface UpdateClientDto {
  fullName?: string;
  phone?: string;
  gender?: Gender;
  notes?: string;
  measurements?: Record<string, any>;
}
