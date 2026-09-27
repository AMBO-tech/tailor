import { Order } from './order.types';
import { PaymentEntry } from './payment.types';

export interface DashboardMetrics {
  activeOrdersCount: number;
  urgentOrdersCount: number;
  fittingTodayCount?: number;
  totalRemainingDue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  /**
   * Vrai quand le chiffre d'affaires est masqué par l'API (employé) : les
   * montants valent alors `0` et ne doivent pas être affichés.
   */
  revenueHidden?: boolean;
  recentPayments: PaymentEntry[];
  urgentOrders: Order[];
}
