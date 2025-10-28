import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { DateRangePicker } from '@components/common/DateRangePicker';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { useAnalytics } from '@hooks/useAnalytics';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '@utils/formatters';

const CHART_COLORS = ['#0EA5E9', '#22C55E', '#F97316', '#6366F1', '#EC4899'];

const DEFAULT_RANGE_DAYS = 30;

const subtractDays = (date: Date, days: number) =>
  new Date(date.getTime() - days * 24 * 60 * 60 * 1000);

export const AnalyticsDashboard: React.FC = () => {
  const [range, setRange] = useState({
    start: subtractDays(new Date(), DEFAULT_RANGE_DAYS),
    end: new Date(),
  });

  const { data, isLoading, error, refetch } = useAnalytics(range);

  const metrics = data?.dashboardMetrics;
  const trends = data?.transactionTrends;
  const agents = data?.agentPerformance ?? [];
  const primaryCurrency = trends?.currency?.[0]?.currency ?? 'USD';

  const getGrowthBadge = (growth?: number) => {
    if (growth === undefined) {
      return <Badge variant="gray">0%</Badge>;
    }

    if (growth > 0) {
      return <Badge variant="success">+{formatPercentage(growth, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</Badge>;
    }

    if (growth < 0) {
      return (
        <Badge variant="error">{formatPercentage(growth, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</Badge>
      );
    }

    return <Badge variant="gray">0%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-8 text-center text-error-700">
        <p className="text-sm font-medium">Error loading analytics.</p>
        <p className="mt-2 text-sm text-error-600">{error.message}</p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor transaction health, revenue performance, and agent productivity in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            startDate={range.start}
            endDate={range.end}
            onDateChange={setRange}
          />
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Transactions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(metrics?.totalTransactions ?? 0)}
            </div>
            <div className="mt-2">{getGrowthBadge(metrics?.growth.transactions)}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(metrics?.totalVolume ?? 0, primaryCurrency, { fromMinorUnit: false })}
            </div>
            <div className="mt-2">{getGrowthBadge(metrics?.growth.volume)}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Success Rate</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-semibold text-gray-900">
              {formatPercentage(metrics?.successRate ?? 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {formatNumber(metrics?.activeAgents ?? 0)} active agents
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(metrics?.revenue ?? 0, primaryCurrency, { fromMinorUnit: false })}
            </div>
            <div className="mt-2">{getGrowthBadge(metrics?.growth.revenue)}</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume Trend</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends?.daily ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'volume') {
                        return [
                          formatCurrency(value, primaryCurrency, { fromMinorUnit: false }),
                          'Volume',
                        ];
                      }
                      return [formatNumber(value), 'Count'];
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="volume"
                    stroke="#6366F1"
                    fill="#6366F1"
                    fillOpacity={0.2}
                    name="Volume"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#22C55E"
                    fill="#22C55E"
                    fillOpacity={0.15}
                    name="Count"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Status Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trends?.status ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ status, percentage }) =>
                      `${status} (${formatPercentage(percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })})`
                    }
                  >
                    {(trends?.status ?? []).map((entry, index) => (
                      <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Transaction Patterns</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends?.hourly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Bar dataKey="count" fill="#0EA5E9" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends?.currency ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="currency" type="category" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'volume') {
                        return [
                          formatCurrency(value, primaryCurrency, { fromMinorUnit: false }),
                          'Volume',
                        ];
                      }
                      return [formatNumber(value), 'Count'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="volume" fill="#22C55E" name="Volume" />
                  <Bar dataKey="count" fill="#6366F1" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Agents</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">Agent Name</th>
                  <th className="py-3 pr-4 text-right">Executions</th>
                  <th className="py-3 pr-4 text-right">Success Rate</th>
                  <th className="py-3 pr-4 text-right">Avg Duration</th>
                  <th className="py-3 pr-4 text-right">Revenue</th>
                  <th className="py-3 text-right">Last Execution</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                      No agent executions recorded in this period.
                    </td>
                  </tr>
                ) : (
                  agents.slice(0, 10).map(agent => {
                    const lastExecutionLabel = agent.lastExecution
                      ? new Date(agent.lastExecution).toLocaleString()
                      : '—';

                    return (
                      <tr key={agent.agentId} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">{agent.agentName}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {formatNumber(agent.executionCount)}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {formatPercentage(agent.successRate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {formatNumber(Math.round(agent.averageDuration))} ms
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {formatCurrency(agent.revenue, primaryCurrency, { fromMinorUnit: false })}
                        </td>
                        <td className="py-3 text-right text-gray-700">{lastExecutionLabel}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
