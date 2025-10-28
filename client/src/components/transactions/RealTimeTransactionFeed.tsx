import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { useRealTime } from '@hooks/useRealTime';

interface TransactionFeedEvent {
  transactionId: string;
  status: string;
  amount?: number;
  currency?: string;
  updatedAt?: string;
  message?: string;
}

const getStatusAccent = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return { icon: CheckCircleIcon, className: 'text-green-600' };
    case 'FAILED':
    case 'CANCELLED':
      return { icon: ExclamationTriangleIcon, className: 'text-red-600' };
    default:
      return { icon: ClockIcon, className: 'text-amber-600' };
  }
};

const formatAmount = (amount?: number, currency?: string) => {
  if (amount === undefined || currency === undefined) {
    return null;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

export const RealTimeTransactionFeed: React.FC = () => {
  const { data, isConnected } = useRealTime<TransactionFeedEvent>({
    event: 'transaction:status:updated',
  });
  const [events, setEvents] = useState<TransactionFeedEvent[]>([]);

  useEffect(() => {
    if (data) {
      setEvents(prev => {
        const next = [data, ...prev];
        return next.slice(0, 20);
      });
    }
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Live Activity</span>
          <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {isConnected ? 'Streaming' : 'Offline'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody className="max-h-[28rem] overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500">
            {isConnected ? (
              <>
                <LoadingSpinner size="sm" className="mb-3" />
                <p>Waiting for live transaction updates…</p>
              </>
            ) : (
              <p>Live updates will appear here once connected.</p>
            )}
          </div>
        ) : (
          <ul className="space-y-3 text-sm">
            {events.map(event => {
              const accent = getStatusAccent(event.status);
              const formattedAmount = formatAmount(event.amount, event.currency);
              const Icon = accent.icon;

              return (
                <li
                  key={`${event.transactionId}-${event.status}-${event.updatedAt ?? Math.random()}`}
                  className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${accent.className}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.status}
                        </p>
                        <p className="font-mono text-xs text-gray-500">
                          {event.transactionId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {event.updatedAt
                        ? new Date(event.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <div>{event.message}</div>
                    {formattedAmount && <div className="font-medium text-gray-700">{formattedAmount}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};

export default RealTimeTransactionFeed;
