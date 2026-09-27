import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@services/api/dashboard.service';
import { DashboardMetrics } from '@types';
import { getActiveWorkshopId } from '@utils/storage';

/** Clés du cache du tableau de bord (`all` = préfixe d'invalidation, ARC-1). */
export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  metrics: () => ['dashboard', getActiveWorkshopId()] as const,
};

export function useDashboardQuery() {
  return useQuery<DashboardMetrics>({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(),
    queryFn: () => dashboardService.getDashboard(),
    refetchInterval: 30000, // 30s auto-refresh
  });
}
