import { Types } from 'mongoose';
import { AuditLog, Agent, Mandate, Transaction } from '../../models/index.js';

type MaybeArray<T> = T | T[] | undefined;

interface AnalyticsFilters {
  agentIds?: string[];
  statuses?: string[];
  currencies?: string[];
}

interface AnalyticsQuery {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  filters?: AnalyticsFilters;
}

export interface DashboardMetrics {
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  successRate: number;
  activeAgents: number;
  revenue: number;
  growth: {
    transactions: number;
    volume: number;
    revenue: number;
  };
}

export interface TransactionTrendPoint {
  date: string;
  count: number;
  volume: number;
}

export interface TransactionHourPoint {
  hour: number;
  count: number;
  volume: number;
}

export interface TransactionCurrencyPoint {
  currency: string;
  count: number;
  volume: number;
}

export interface TransactionStatusPoint {
  status: string;
  count: number;
  percentage: number;
}

export interface TransactionTrends {
  daily: TransactionTrendPoint[];
  hourly: TransactionHourPoint[];
  currency: TransactionCurrencyPoint[];
  status: TransactionStatusPoint[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  executionCount: number;
  successRate: number;
  averageDuration: number;
  revenue: number;
  lastExecution: Date | null;
}

export interface CustomReportResult<T = unknown> {
  type: string;
  generatedAt: Date;
  payload: T;
}

const toObjectIdArray = (values?: string[]) =>
  values?.filter(Boolean).map(value => new Types.ObjectId(value)) ?? undefined;

const parseMaybeArray = <T extends string>(value: MaybeArray<T>): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

export class AnalyticsService {
  async getDashboardMetrics(query: AnalyticsQuery): Promise<DashboardMetrics> {
    const { tenantId, startDate, endDate, filters } = query;

    const currentMetrics = await this.calculatePeriodMetrics(tenantId, startDate, endDate, filters);

    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodDuration);
    const previousEnd = new Date(endDate.getTime() - periodDuration);

    const previousMetrics = await this.calculatePeriodMetrics(
      tenantId,
      previousStart,
      previousEnd,
      filters
    );

    const growth = {
      transactions: this.calculateGrowth(currentMetrics.totalTransactions, previousMetrics.totalTransactions),
      volume: this.calculateGrowth(currentMetrics.totalVolume, previousMetrics.totalVolume),
      revenue: this.calculateGrowth(currentMetrics.revenue, previousMetrics.revenue),
    };

    return {
      ...currentMetrics,
      growth,
    };
  }

  async getTransactionTrends(query: AnalyticsQuery): Promise<TransactionTrends> {
    const { tenantId, startDate, endDate, filters } = query;

    const tenantObjectId = new Types.ObjectId(tenantId);
    const matchStage: Record<string, unknown> = {
      tenantId: tenantObjectId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (filters?.statuses?.length) {
      matchStage.status = { $in: filters.statuses };
    }

    if (filters?.currencies?.length) {
      matchStage['amount.currency'] = { $in: filters.currencies };
    }

    if (filters?.agentIds?.length) {
      matchStage.agentId = { $in: toObjectIdArray(filters.agentIds) };
    }

    const [daily, hourly, currency, statusData] = await Promise.all([
      Transaction.aggregate<{
        date: string;
        count: number;
        volume: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            volume: { $sum: '$amount.value' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
            volume: 1,
          },
        },
      ]),
      Transaction.aggregate<{
        hour: number;
        count: number;
        volume: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
            volume: { $sum: '$amount.value' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            hour: '$_id',
            count: 1,
            volume: 1,
          },
        },
      ]),
      Transaction.aggregate<{
        currency: string;
        count: number;
        volume: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: '$amount.currency',
            count: { $sum: 1 },
            volume: { $sum: '$amount.value' },
          },
        },
        { $sort: { volume: -1 } },
        {
          $project: {
            _id: 0,
            currency: '$_id',
            count: 1,
            volume: 1,
          },
        },
      ]),
      Transaction.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalTransactions = statusData.reduce((sum, entry) => sum + entry.count, 0) || 1;

    const status: TransactionStatusPoint[] = statusData.map(entry => ({
      status: entry._id,
      count: entry.count,
      percentage: (entry.count / totalTransactions) * 100,
    }));

    return {
      daily,
      hourly,
      currency,
      status,
    };
  }

  async getAgentPerformance(query: AnalyticsQuery): Promise<AgentPerformance[]> {
    const { tenantId, startDate, endDate, filters } = query;
    const tenantObjectId = new Types.ObjectId(tenantId);

    const agentCriteria: Record<string, unknown> = { tenantId: tenantObjectId };
    if (filters?.agentIds?.length) {
      agentCriteria._id = { $in: toObjectIdArray(filters.agentIds) };
    }

    const agents = await Agent.find(agentCriteria).lean();
    if (!agents.length) {
      return [];
    }

    const performanceResults: AgentPerformance[] = [];

    for (const agent of agents) {
      const agentId = agent._id.toString();

      const [executions, transactions] = await Promise.all([
        AuditLog.find({
          tenantId: tenantObjectId,
          resourceId: agentId,
          action: { $in: ['AGENT_EXECUTION_STARTED', 'AGENT_EXECUTION_COMPLETED', 'AGENT_EXECUTION_FAILED'] },
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .sort({ createdAt: 1 })
          .lean(),
        Transaction.find({
          tenantId: tenantObjectId,
          agentId: agent._id,
          status: 'COMPLETED',
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .select(['amount.value'])
          .lean(),
      ]);

      const completedExecutions = executions.filter(entry => entry.action === 'AGENT_EXECUTION_COMPLETED');
      const failedExecutions = executions.filter(entry => entry.action === 'AGENT_EXECUTION_FAILED');
      const totalExecutions = completedExecutions.length + failedExecutions.length;

      const successRate = totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0;

      const durations = completedExecutions
        .map(entry => {
          const duration = (entry.changes as Record<string, unknown> | undefined)?.execution as
            | { duration?: number }
            | undefined;
          return duration?.duration;
        })
        .filter((value): value is number => typeof value === 'number');

      const averageDuration = durations.length
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : 0;

      const revenue = transactions.reduce((sum, transaction) => sum + (transaction.amount?.value ?? 0), 0);

      const lastExecution = executions
        .filter(entry => entry.action === 'AGENT_EXECUTION_STARTED')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt;

      performanceResults.push({
        agentId,
        agentName: agent.name,
        executionCount: totalExecutions,
        successRate,
        averageDuration,
        revenue,
        lastExecution: lastExecution ?? agent.lastExecutedAt ?? null,
      });
    }

    return performanceResults.sort((a, b) => b.revenue - a.revenue);
  }

  async generateCustomReport(
    query: AnalyticsQuery & { reportType: string }
  ): Promise<CustomReportResult> {
    const { reportType } = query;

    switch (reportType) {
      case 'COMPLIANCE':
        return this.generateComplianceReport(query);
      case 'REVENUE':
        return this.generateRevenueReport(query);
      case 'PERFORMANCE':
        return this.generatePerformanceReport(query);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async calculatePeriodMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    filters?: AnalyticsFilters
  ) {
    const tenantObjectId = new Types.ObjectId(tenantId);

    const query: Record<string, unknown> = {
      tenantId: tenantObjectId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (filters?.statuses?.length) {
      query.status = { $in: filters.statuses };
    }

    if (filters?.currencies?.length) {
      query['amount.currency'] = { $in: filters.currencies };
    }

    if (filters?.agentIds?.length) {
      query.agentId = { $in: toObjectIdArray(filters.agentIds) };
    }

    const transactions = await Transaction.find(query).lean();

    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(transaction => transaction.status === 'COMPLETED');

    const totalVolume = completedTransactions.reduce(
      (sum, transaction) => sum + (transaction.amount?.value ?? 0),
      0
    );

    const averageTransactionValue = completedTransactions.length
      ? totalVolume / completedTransactions.length
      : 0;

    const successRate = totalTransactions
      ? (completedTransactions.length / totalTransactions) * 100
      : 0;

    const activeAgents = await Agent.countDocuments({
      tenantId: tenantObjectId,
      status: 'ACTIVE',
      lastExecutedAt: { $gte: startDate },
    });

    const revenue = totalVolume * 0.029;

    return {
      totalTransactions,
      totalVolume,
      averageTransactionValue,
      successRate,
      activeAgents,
      revenue,
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }

  private async generateComplianceReport(
    query: AnalyticsQuery & { reportType: string }
  ): Promise<CustomReportResult> {
    const { tenantId, startDate, endDate } = query;
    const tenantObjectId = new Types.ObjectId(tenantId);

    const [mandates, alerts] = await Promise.all([
      Mandate.countDocuments({
        tenantId: tenantObjectId,
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      AuditLog.find({
        tenantId: tenantObjectId,
        action: { $in: ['FRAUD_ALERT_CREATED', 'MANDATE_VIOLATION'] },
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select(['action', 'metadata', 'createdAt'])
        .lean(),
    ]);

    const issues = alerts.map(alert => ({
      type: alert.action,
      timestamp: alert.createdAt,
      severity: (alert.metadata as Record<string, unknown> | undefined)?.severity ?? 'MEDIUM',
    }));

    return {
      type: 'COMPLIANCE',
      generatedAt: new Date(),
      payload: {
        mandatesCreated: mandates,
        alerts: issues,
      },
    };
  }

  private async generateRevenueReport(
    query: AnalyticsQuery & { reportType: string }
  ): Promise<CustomReportResult> {
    const { tenantId, startDate, endDate, filters } = query;

    const metrics = await this.calculatePeriodMetrics(tenantId, startDate, endDate, filters);
    const currencyBreakdown = await this.getTransactionTrends({ tenantId, startDate, endDate, filters });

    return {
      type: 'REVENUE',
      generatedAt: new Date(),
      payload: {
        metrics,
        currencyDistribution: currencyBreakdown.currency,
      },
    };
  }

  private async generatePerformanceReport(
    query: AnalyticsQuery & { reportType: string }
  ): Promise<CustomReportResult> {
    const performance = await this.getAgentPerformance(query);

    return {
      type: 'PERFORMANCE',
      generatedAt: new Date(),
      payload: {
        agents: performance,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();

export const normalizeAnalyticsFilters = (filters: {
  agentIds?: MaybeArray<string>;
  statuses?: MaybeArray<string>;
  currencies?: MaybeArray<string>;
}): AnalyticsFilters | undefined => {
  const parsedAgentIds = parseMaybeArray(filters.agentIds);
  const parsedStatuses = parseMaybeArray(filters.statuses)?.map(status => status.toUpperCase());
  const parsedCurrencies = parseMaybeArray(filters.currencies)?.map(currency => currency.toUpperCase());

  if (parsedAgentIds?.length || parsedStatuses?.length || parsedCurrencies?.length) {
    return {
      agentIds: parsedAgentIds,
      statuses: parsedStatuses,
      currencies: parsedCurrencies,
    };
  }

  return undefined;
};
