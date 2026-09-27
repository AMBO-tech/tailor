export type PaymentMethod = 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';

export type PaymentChannel = 'ORDER_DEPOSIT' | 'ORDER_BALANCE' | 'SUBSCRIPTION_FEE';

export interface PaymentOrderSummary {
  id?: string;
  orderNumber?: string;
  modelName?: string;
  totalAmount?: number | string;
  client?: {
    id?: string;
    fullName?: string;
    phone?: string;
  };
}

export interface PaymentEntry {
  id: string;
  workshopId: string;
  orderId?: string;
  clientMutationId?: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  channel: PaymentChannel;
  paidAt: string;
  order?: PaymentOrderSummary;
  /** Lien WhatsApp du reçu ; l'API peut renvoyer `null` (pas de téléphone). */
  whatsAppLink?: string | null;
  isSynced?: boolean;
}

export interface RecordPaymentDto {
  id?: string;
  clientMutationId?: string;
  orderId?: string;
  amount: number;
  method: PaymentMethod;
  channel: PaymentChannel;
}

export interface RecordPaymentResponse extends PaymentEntry {
  /** Lien WhatsApp du reçu ; l'API peut renvoyer `null` (pas de téléphone). */
  whatsAppLink?: string | null;
}
