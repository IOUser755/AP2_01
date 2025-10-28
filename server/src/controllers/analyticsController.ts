import { Request, Response, NextFunction } from 'express';
import { analyticsService, normalizeAnalyticsFilters } from '../services/analytics/AnalyticsService.js';
import { CustomError } from '../utils/errors.js';

const DEFAULT_RANGE_IN_DAYS = 30;

const parseDate = (value?: string | string[]): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  const date = new Date(raw ?? '');

  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const getAnalyticsOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const { startDate: startDateParam, endDate: endDateParam, reportType, ...filters } = req.query;

    const endDate = parseDate(endDateParam as string | string[]) ?? new Date();
    const startDate =
      parseDate(startDateParam as string | string[]) ??
      new Date(endDate.getTime() - DEFAULT_RANGE_IN_DAYS * 24 * 60 * 60 * 1000);

    if (startDate > endDate) {
      throw new CustomError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    const analyticsQuery = {
      tenantId: req.tenant._id.toString(),
      startDate,
      endDate,
      filters: normalizeAnalyticsFilters({
        agentIds: filters.agentIds as string | string[] | undefined,
        statuses: filters.statuses as string | string[] | undefined,
        currencies: filters.currencies as string | string[] | undefined,
      }),
    };

    if (typeof reportType === 'string' && reportType.length > 0) {
      const report = await analyticsService.generateCustomReport({
        ...analyticsQuery,
        reportType: reportType.toUpperCase(),
      });

      res.json({
        data: report,
      });
      return;
    }

    const [dashboardMetrics, transactionTrends, agentPerformance] = await Promise.all([
      analyticsService.getDashboardMetrics(analyticsQuery),
      analyticsService.getTransactionTrends(analyticsQuery),
      analyticsService.getAgentPerformance(analyticsQuery),
    ]);

    res.json({
      data: {
        dashboardMetrics,
        transactionTrends,
        agentPerformance,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
