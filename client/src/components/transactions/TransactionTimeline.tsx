import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { TransactionTimelineEvent } from '@types/transaction';

interface TransactionTimelineProps {
  timeline: TransactionTimelineEvent[];
}

const getTimelineAccent = (status: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'CAPTURED':
      return { icon: CheckCircleIcon, className: 'text-green-600' };
    case 'FAILED':
    case 'CANCELLED':
      return { icon: ExclamationTriangleIcon, className: 'text-red-600' };
    default:
      return { icon: ClockIcon, className: 'text-amber-600' };
  }
};

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <p className="text-sm text-gray-500">No timeline events recorded for this transaction.</p>;
  }

  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <ol className="relative border-l border-gray-200 pl-6 text-sm">
      {sortedTimeline.map(event => {
        const accent = getTimelineAccent(event.status.toUpperCase());
        const Icon = accent.icon;

        return (
          <li key={`${event.status}-${event.timestamp}`} className="mb-6 ml-4">
            <span className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ${accent.className}`}>
              <Icon className="h-3 w-3 text-white" />
            </span>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{event.status}</p>
              <time className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            </div>
            {event.message && <p className="mt-1 text-gray-600">{event.message}</p>}
            {event.metadata && (
              <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-500">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default TransactionTimeline;
