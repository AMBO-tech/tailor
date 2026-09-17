export type UserSystemRole = 'SUPER_ADMIN' | 'USER';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  systemRole: UserSystemRole;
}

export interface WorkshopSummary {
  workshopId: string;
  role: 'OWNER' | 'MANAGER' | 'TAILOR' | 'APPRENTICE';
  name: string;
  codePrefix: string;
  logoUrl?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  accessToken?: string;
  workshops: Workshop[];
}

export interface LoginDto {
  phone: string;
  pin: string;
}

export interface RegisterDto {
  phone: string;
  pin: string;
  fullName: string;
  workshopName: string;
  logo?: string;
}

import { Workshop } from './workshop.types';
