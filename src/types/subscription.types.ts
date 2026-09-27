import type { WorkshopSubscription } from './workshop.types';

/** Forfait d'abonnement. */
export type SubscriptionPlanCode = 'SOLO' | 'EQUIPE';

/** Moyens de transfert acceptés pour un abonnement (pas d'espèces). */
export type SubscriptionTransferMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';

/** Statut d'une demande « J'ai déjà payé ». */
export type SubscriptionPaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

/** Réponse de `GET /public/config`. */
export interface PublicConfig {
  /** Numéro Wave / Orange Money / Free Money où envoyer l'abonnement (ou `null`). */
  subscriptionTransferPhone: string | null;
  currency: string;
  prices: Record<SubscriptionPlanCode, number>;
  maxSubscriptionMonths: number;
  onlinePaymentEnabled: boolean;
}

/** Demande de paiement d'abonnement en attente (vue atelier). */
export interface SubscriptionPendingPayment {
  id: string;
  reference: string;
  plan: SubscriptionPlanCode;
  months: number;
  amount: number;
  method: SubscriptionTransferMethod;
  status: SubscriptionPaymentStatus;
  createdAt: string;
}

/** Abonnement courant enrichi par l'API. */
export interface CurrentSubscriptionDetails extends WorkshopSubscription {
  /** Jours restants avant l'échéance (0 si échu). */
  daysRemaining: number;
  /** Atelier en lecture seule (abonnement suspendu ou échu). */
  isReadOnly: boolean;
}

/** Réponse de `GET /subscriptions/current`. */
export interface CurrentSubscriptionResponse {
  subscription: CurrentSubscriptionDetails | null;
  pendingPayments: SubscriptionPendingPayment[];
  onlinePaymentEnabled: boolean;
}

/** Corps de `POST /subscriptions/manual-payments`. */
export interface CreateManualPaymentDto {
  /** Clé d'idempotence générée à l'ouverture du formulaire. */
  clientMutationId: string;
  plan: SubscriptionPlanCode;
  months: number;
  method: SubscriptionTransferMethod;
  transactionRef?: string;
}

/** Réponse de `POST /subscriptions/manual-payments`. */
export interface ManualPaymentResponse {
  id: string;
  reference: string;
  amount: number;
  status: SubscriptionPaymentStatus;
  /** Lien WhatsApp pré-rempli vers l'administrateur, ou `null`. */
  whatsAppUrl: string | null;
  /** `false` si la demande a été mise en file hors ligne. */
  isSynced?: boolean;
}
