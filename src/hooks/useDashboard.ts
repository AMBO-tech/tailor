import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@services/api/dashboard.service';
import { DashboardMetrics } from '@types';

export const DASHBOARD_QUERY_KEYS = {
  metrics: ['dashboard'] as const,
};

export function useDashboardQuery() {
  return useQuery<DashboardMetrics>({
    queryKey: DASHBOARD_QUERY_KEYS.metrics,
    queryFn: () => dashboardService.getDashboard(),
    refetchInterval: 30000, // 30s auto-refresh
  });
}
