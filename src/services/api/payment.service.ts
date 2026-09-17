import { request } from './apiClient';
import { PaymentEntry, RecordPaymentDto, RecordPaymentResponse } from '@types';

export const paymentService = {
  async listPayments(): Promise<PaymentEntry[]> {
    return request<PaymentEntry[]>('/payments');
  },

  async recordPayment(data: RecordPaymentDto): Promise<RecordPaymentResponse> {
    return request<RecordPaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
