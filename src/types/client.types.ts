export type Gender = 'M' | 'F';

/** Carnet de mesures : clé de mensuration → valeur en cm (nombre, ou chaîne vide si effacée). */
export type Measurements = Record<string, number | string>;

export interface Client {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string;
  gender: Gender;
  notes?: string;
  measurements: Measurements;
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
  measurements?: Measurements;
}

export interface UpdateClientDto {
  fullName?: string;
  phone?: string;
  gender?: Gender;
  notes?: string;
  measurements?: Measurements;
}
