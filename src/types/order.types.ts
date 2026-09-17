export type OrderStatus = 'EN_COURS' | 'TERMINE' | 'LIVRE' | 'ANNULE';

export interface OrderClientSummary {
  id: string;
  fullName: string;
  phone: string;
}

export interface Order {
  id: string;
  workshopId: string;
  clientId: string;
  clientMutationId?: string;
  orderNumber: string;
  modelName: string;
  fabricPhotoUrl?: string;
  totalAmount: number;
  totalPaid?: number;
  remainingBalance?: number;
  status: OrderStatus;
  fittingDate?: string;
  deliveryDeadline: string;
  measurementSnapshot?: Record<string, any>;
  client?: OrderClientSummary;
  createdAt: string;
  updatedAt?: string;
  isSynced?: boolean;
}

export interface CreateOrderDto {
  id?: string;
  clientMutationId?: string;
  clientId: string;
  modelName: string;
  fabricPhotoUrl?: string;
  totalAmount: number;
  depositAmount?: number;
  paymentMethod?: string;
  fittingDate?: string;
  deliveryDeadline: string;
  measurementSnapshot?: Record<string, any>;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
