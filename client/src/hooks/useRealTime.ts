import { useEffect, useRef, useState } from 'react';

import { useWebSocket } from '@context/WebSocketContext';

interface UseRealTimeOptions<T> {
  event: string;
  initialData?: T;
  transform?: (data: any) => T;
  filter?: (data: any) => boolean;
}

export function useRealTime<T = any>({
  event,
  initialData,
  transform,
  filter,
}: UseRealTimeOptions<T>) {
  const { subscribe, isConnected } = useWebSocket();
  const [data, setData] = useState<T | undefined>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleUpdate = (payload: any) => {
      if (filter && !filter(payload)) {
        return;
      }

      const next = transform ? transform(payload) : payload;
      setData(next);
      setLastUpdate(new Date());
    };

    unsubscribeRef.current = subscribe(event, handleUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [event, filter, isConnected, subscribe, transform]);

  return {
    data,
    lastUpdate,
    isConnected,
  };
}

export function useAgentExecutionStatus(agentId: string) {
  return useRealTime({
    event: 'agent:execution:status',
    filter: data => data.agentId === agentId,
  });
}

export function useTransactionUpdates(transactionId?: string) {
  return useRealTime({
    event: 'transaction:status:updated',
    filter: data => !transactionId || data.transactionId === transactionId,
  });
}

export function useMandateUpdates(agentId?: string) {
  return useRealTime({
    event: 'mandate:created',
    filter: data => !agentId || data.agentId === agentId,
  });
}
