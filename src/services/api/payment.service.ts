import { request } from './apiClient';
import { PaymentEntry, RecordPaymentDto, RecordPaymentResponse, CursorPage } from '@types';
import { buildPageUrl, toCursorPage } from './pagination';

export const paymentService = {
  async listPayments(): Promise<PaymentEntry[]> {
    return request<PaymentEntry[]>('/payments');
  },

  /** Page d'encaissements (`?limit=30&cursor=`). */
  async listPaymentsPage(cursor?: string): Promise<CursorPage<PaymentEntry>> {
    return toCursorPage(await request<PaymentEntry[] | CursorPage<PaymentEntry>>(buildPageUrl('/payments', {}, cursor)));
  },

  async recordPayment(data: RecordPaymentDto): Promise<RecordPaymentResponse> {
    return request<RecordPaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
