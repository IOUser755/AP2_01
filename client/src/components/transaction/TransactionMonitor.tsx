import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useWebSocket } from '@hooks/useWebSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { formatCurrency } from '@utils/formatters';

interface TransactionEvent {
  id: string;
  type: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    agentId?: string;
    agentName?: string;
  };
  timestamp: string | Date;
}

const eventVariantMap: Record<TransactionEvent['type'], 'secondary' | 'primary' | 'success' | 'error' | 'warning'> = {
  CREATED: 'secondary',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'warning',
};

export const TransactionMonitor: React.FC = () => {
  const { subscribe, connected } = useWebSocket();
  const [recentTransactions, setRecentTransactions] = useState<TransactionEvent[]>([]);

  useEffect(() => {
    if (!connected) {
      return;
    }

    const unsubscribe = subscribe('transaction:update', (event: TransactionEvent) => {
      setRecentTransactions(prev => {
        const updated = [event, ...prev];
        return updated.slice(0, 10);
      });

      if (event.type === 'COMPLETED') {
        toast.success(
          `Transaction completed: ${formatCurrency(event.transaction.amount, event.transaction.currency)}`
        );
      } else if (event.type === 'FAILED') {
        toast.error(`Transaction failed${event.transaction.agentName ? ` for ${event.transaction.agentName}` : ''}`);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [connected, subscribe]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Live Transaction Feed</CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No recent transactions</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(event => (
              <div
                key={`${event.transaction.id}-${event.timestamp}`}
                className="animate-slide-in rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {event.transaction.agentName ?? 'Unknown Agent'}
                  </span>
                  <Badge variant={eventVariantMap[event.type]}>{event.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {formatCurrency(event.transaction.amount, event.transaction.currency)}
                  </span>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionMonitor;
