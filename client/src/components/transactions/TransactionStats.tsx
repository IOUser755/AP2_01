import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody } from '@components/common/Card';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { useTransactionAnalytics } from '@hooks/useTransactions';

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export const TransactionStats: React.FC = () => {
  const { data, isLoading } = useTransactionAnalytics({ groupBy: 'day' });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(key => (
          <Card key={key}>
            <CardBody className="flex items-center justify-center py-6">
              <LoadingSpinner size="sm" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { totals, byStatus } = data;
  const completed = byStatus?.COMPLETED ?? 0;
  const failed = byStatus?.FAILED ?? 0;
  const processing = (byStatus?.PROCESSING ?? 0) + (byStatus?.PENDING ?? 0);
  const successRate = totals.count > 0 ? (completed / totals.count) * 100 : 0;

  const cards = [
    {
      title: 'Total Volume',
      value: formatCurrency(totals.volume, totals.currency),
      icon: ArrowTrendingUpIcon,
      accent: 'text-primary-600 bg-primary-100',
    },
    {
      title: 'Transactions',
      value: totals.count.toLocaleString(),
      icon: ArrowPathIcon,
      accent: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircleIcon,
      accent: 'text-green-600 bg-green-100',
    },
    {
      title: 'At Risk',
      value: `${failed} failed • ${processing} pending`,
      icon: ExclamationTriangleIcon,
      accent: 'text-amber-600 bg-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{card.value}</p>
              </div>
              <div className={`rounded-full p-3 ${card.accent}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default TransactionStats;
