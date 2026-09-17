export * from './auth.types';
export * from './workshop.types';
export * from './client.types';
export * from './order.types';
export * from './payment.types';
export * from './dashboard.types';

export interface PendingMutation {
  id: string;
  type: 'CREATE_CLIENT' | 'CREATE_ORDER' | 'RECORD_PAYMENT' | 'UPDATE_ORDER_STATUS';
  payload: any;
  createdAt: string;
  retryCount: number;
}
