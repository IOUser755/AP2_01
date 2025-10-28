import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, AnalyticsQueryParams } from '@services/analyticsService';
import type { AnalyticsDashboardResponse } from '@types/analytics';

const ANALYTICS_DASHBOARD_QUERY_KEY = 'analytics-dashboard';

export interface DateRange {
  start: Date;
  end: Date;
}

interface UseAnalyticsFilters {
  agentIds?: string[];
  statuses?: string[];
  currencies?: string[];
}

export const useAnalytics = (
  range: DateRange,
  filters?: UseAnalyticsFilters
) => {
  const queryParams = useMemo<AnalyticsQueryParams>(() => ({
    startDate: range.start.toISOString(),
    endDate: range.end.toISOString(),
    agentIds: filters?.agentIds,
    statuses: filters?.statuses,
    currencies: filters?.currencies,
  }), [range.end, range.start, filters?.agentIds, filters?.currencies, filters?.statuses]);

  return useQuery<AnalyticsDashboardResponse, Error>({
    queryKey: [ANALYTICS_DASHBOARD_QUERY_KEY, queryParams],
    queryFn: () => analyticsService.getDashboard(queryParams),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });
};
