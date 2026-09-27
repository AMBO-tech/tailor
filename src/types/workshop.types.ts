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

/**
 * Réponse de `POST /workshops/invite`. L'API renvoie `token` et `inviteUrl`
 * (`/join?token=…`) ; `message` et `inviteLink` restent acceptés (anciens formats).
 */
export interface InviteMemberResponse {
  token?: string;
  inviteUrl?: string;
  message?: string;
  inviteLink?: string;
  whatsAppLink: string;
}

/** Corps de `POST /workshops/join` (route publique). */
export interface AcceptInvitationDto {
  token: string;
  fullName: string;
  pin: string;
}

/** Réponse de `POST /workshops/join`. */
export interface AcceptInvitationResponse {
  message: string;
}
