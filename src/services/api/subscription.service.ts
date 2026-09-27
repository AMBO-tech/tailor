import { request } from './apiClient';
import type {
  CreateManualPaymentDto,
  CurrentSubscriptionResponse,
  ManualPaymentResponse,
  PublicConfig,
} from '@types';

/** Appels d'API liés à l'abonnement de l'atelier. */
export const subscriptionService = {
  /** `GET /public/config` : tarifs, numéro de transfert, durée maximale. */
  async getPublicConfig(): Promise<PublicConfig> {
    return request<PublicConfig>('/public/config');
  },

  /** `GET /subscriptions/current` : abonnement courant et demandes en attente. */
  async getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
    return request<CurrentSubscriptionResponse>('/subscriptions/current');
  },

  /** `POST /subscriptions/manual-payments` : « J'ai déjà payé » (idempotent). */
  async createManualPayment(data: CreateManualPaymentDto): Promise<ManualPaymentResponse> {
    return request<ManualPaymentResponse>('/subscriptions/manual-payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
