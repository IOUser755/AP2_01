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
  lastExecution: string | null;
}

export interface AnalyticsDashboardResponse {
  dashboardMetrics: DashboardMetrics;
  transactionTrends: TransactionTrends;
  agentPerformance: AgentPerformance[];
  period: {
    start: string;
    end: string;
  };
}

export interface AnalyticsReport<T = unknown> {
  type: string;
  generatedAt: string;
  payload: T;
}
