import { Order } from './order.types';
import { PaymentEntry } from './payment.types';

export interface DashboardMetrics {
  activeOrdersCount: number;
  urgentOrdersCount: number;
  fittingTodayCount?: number;
  totalRemainingDue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  recentPayments: PaymentEntry[];
  urgentOrders: Order[];
}
