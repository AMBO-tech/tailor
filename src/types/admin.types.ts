import type { User } from './auth.types';
import type {
  SubscriptionPaymentStatus,
  SubscriptionPlanCode,
  SubscriptionTransferMethod,
} from './subscription.types';

/** Utilisateur du back-office (super-administrateur). */
export interface AdminUser extends Omit<User, 'systemRole'> {
  email?: string;
  systemRole: 'SUPER_ADMIN' | 'USER';
}

/** Réponse de `POST /auth/admin/login`. */
export interface AdminLoginResponse {
  accessToken: string;
  user: AdminUser;
  workshops: unknown[];
}

/** Demande « J'ai déjà payé » vue par l'administrateur. */
export interface AdminSubscriptionPayment {
  id: string;
  reference: string;
  plan: SubscriptionPlanCode;
  months: number;
  amount: number;
  method: SubscriptionTransferMethod;
  status: SubscriptionPaymentStatus;
  transactionRef?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  workshop?: { id: string; name: string; codePrefix: string; phoneContact?: string | null };
  requestedBy?: { id: string; fullName: string; phone: string };
}

/** Atelier listé par `GET /super-admin/workshops`. */
export interface AdminWorkshop {
  id: string;
  name: string;
  codePrefix: string;
  createdAt?: string;
  subscription?: {
    plan: SubscriptionPlanCode;
    status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | string;
    currentPeriodEnd?: string;
  } | null;
  members?: Array<{ user?: { id: string; fullName: string; phone: string } }>;
  _count?: { members: number; clients: number; orders: number };
}

/** Page de résultats en mode curseur. */
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

/** Corps de `POST /super-admin/activate-subscription`. */
export interface ActivateSubscriptionDto {
  workshopId: string;
  plan: SubscriptionPlanCode;
  durationMonths: number;
  paymentReference: string;
}
