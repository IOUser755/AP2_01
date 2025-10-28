import api, { ApiResponse } from './api';
import type {
  AnalyticsDashboardResponse,
  AnalyticsReport,
} from '@types/analytics';

export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  agentIds?: string[];
  statuses?: string[];
  currencies?: string[];
  reportType?: string;
}

const buildQueryParams = (params: AnalyticsQueryParams) => {
  const query: Record<string, string> = {
    startDate: params.startDate,
    endDate: params.endDate,
  };

  if (params.agentIds?.length) {
    query.agentIds = params.agentIds.join(',');
  }

  if (params.statuses?.length) {
    query.statuses = params.statuses.join(',');
  }

  if (params.currencies?.length) {
    query.currencies = params.currencies.join(',');
  }

  if (params.reportType) {
    query.reportType = params.reportType;
  }

  return query;
};

class AnalyticsService {
  async getDashboard(params: AnalyticsQueryParams): Promise<AnalyticsDashboardResponse> {
    const response = await api.get<ApiResponse<AnalyticsDashboardResponse>>('/analytics/overview', {
      params: buildQueryParams(params),
    });

    const payload = response.data?.data;
    if (!payload) {
      throw new Error('Analytics payload missing from response');
    }

    const performance = payload.agentPerformance ?? [];

    return {
      ...payload,
      agentPerformance: performance.map(agent => ({
        ...agent,
        lastExecution: agent.lastExecution,
      })),
    };
  }

  async getReport<T = unknown>(params: AnalyticsQueryParams): Promise<AnalyticsReport<T>> {
    const response = await api.get<ApiResponse<AnalyticsReport<T>>>('/analytics/overview', {
      params: buildQueryParams(params),
    });

    const payload = response.data?.data;
    if (!payload) {
      throw new Error('Analytics report payload missing from response');
    }

    return payload;
  }
}

export const analyticsService = new AnalyticsService();
