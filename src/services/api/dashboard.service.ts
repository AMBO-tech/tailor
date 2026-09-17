import { request } from './apiClient';
import { DashboardMetrics } from '@types';

export const dashboardService = {
  async getDashboard(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>('/orders/dashboard');
  },
};
