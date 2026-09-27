export * from './auth.types';
export * from './workshop.types';
export * from './client.types';
export * from './order.types';
export * from './payment.types';
export * from './dashboard.types';
export * from './subscription.types';
export * from './admin.types';

import type { Client, CreateClientDto } from './client.types';
import type { CreateOrderDto, Order, OrderStatus } from './order.types';
import type { PaymentEntry, RecordPaymentDto } from './payment.types';
import type { CreateManualPaymentDto, ManualPaymentResponse } from './subscription.types';

/**
 * État d'une mutation en file :
 * - `pending` : à (re)tenter automatiquement ;
 * - `needs_review` : refusée par le serveur (4xx), à vérifier par l'utilisateur.
 */
export type PendingMutationStatus = 'pending' | 'needs_review';

interface PendingMutationBase {
  /** Identifiant de la file = `clientMutationId` (ou id local) : jamais de doublon. */
  id: string;
  createdAt: string;
  retryCount: number;
  /** Propriétaire « utilisateur:atelier » : la file est cloisonnée par session. */
  ownerKey?: string;
  status?: PendingMutationStatus;
  /** Dernier message d'erreur (réseau ou serveur). */
  lastError?: string;
  /** Prochaine tentative (report exponentiel), en millisecondes epoch. */
  nextAttemptAt?: number;
  /** Entité affichée de façon optimiste en attendant la synchronisation. */
  optimistic?: Client | Order | PaymentEntry | ManualPaymentResponse;
}

/**
 * Mutation hors-ligne en attente de synchronisation (file Dexie).
 * Union discriminée sur `type` : chaque type porte la charge utile attendue
 * par l'appel d'API correspondant (identifiant local `id` toujours présent).
 */
export type PendingMutation = PendingMutationBase &
  (
    | { type: 'CREATE_CLIENT'; payload: CreateClientDto & { id: string } }
    | { type: 'CREATE_ORDER'; payload: CreateOrderDto & { id: string } }
    | { type: 'RECORD_PAYMENT'; payload: RecordPaymentDto & { id: string } }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
    | { type: 'CREATE_SUBSCRIPTION_PAYMENT'; payload: CreateManualPaymentDto & { id: string } }
  );
