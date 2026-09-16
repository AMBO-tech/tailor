export type Gender = 'M' | 'F';

export type WorkshopRole = 'OWNER' | 'EMPLOYEE';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  systemRole: 'SUPER_ADMIN' | 'USER';
}

export interface Workshop {
  workshopId: string;
  name: string;
  codePrefix: string;
  logoUrl?: string;
  role: WorkshopRole;
  subscription?: {
    plan: 'SOLO' | 'EQUIPE';
    status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
    currentPeriodEnd: string;
  };
}

export interface Client {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string;
  gender: Gender;
  notes?: string;
  measurements: Record<string, number | string>;
  createdAt: string;
  updatedAt?: string;
  isSynced?: boolean;
}

export type OrderStatus = 'EN_COURS' | 'TERMINE' | 'LIVRE' | 'ANNULE';

export interface Order {
  id: string;
  workshopId: string;
  clientId: string;
  clientMutationId: string;
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
  client?: {
    id: string;
    fullName: string;
    phone: string;
  };
  createdAt: string;
  isSynced?: boolean;
}

export interface PaymentEntry {
  id: string;
  workshopId: string;
  orderId?: string;
  clientMutationId: string;
  receiptNumber: string;
  amount: number;
  method: 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
  channel: 'ORDER_DEPOSIT' | 'ORDER_BALANCE';
  paidAt: string;
  isSynced?: boolean;
}

export interface PendingMutation {
  id: string;
  type: 'CREATE_CLIENT' | 'CREATE_ORDER' | 'RECORD_PAYMENT';
  payload: any;
  createdAt: string;
  retryCount: number;
}
