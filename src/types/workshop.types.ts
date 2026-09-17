import { User } from './auth.types';

export type WorkshopRole = 'OWNER' | 'EMPLOYEE';

export interface WorkshopSubscription {
  plan: 'SOLO' | 'EQUIPE';
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  currentPeriodEnd?: string;
}

export interface Workshop {
  workshopId: string;
  name: string;
  codePrefix: string;
  logoUrl?: string;
  role: WorkshopRole;
  subscription?: WorkshopSubscription;
}

export interface WorkshopMember {
  id: string;
  workshopId: string;
  userId: string;
  role: WorkshopRole;
  joinedAt: string;
  user?: User;
}

export interface InviteMemberDto {
  phone: string;
}

export interface InviteMemberResponse {
  message: string;
  inviteLink: string;
  whatsAppLink: string;
}
