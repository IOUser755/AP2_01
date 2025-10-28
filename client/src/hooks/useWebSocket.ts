import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

import { useAuth } from './useAuth';

interface WebSocketState {
  connected: boolean;
  socket: Socket | null;
  reconnecting: boolean;
  error: string | null;
}

interface AgentExecutionEvent {
  agentId: string;
  step: string;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  data?: any;
  timestamp: Date;
}

let socketInstance: Socket | null = null;
let subscriberCount = 0;
let baseListenersAttached = false;
let baseHandlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

export const useWebSocket = () => {
  const { user, tenant, token } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    socket: null,
    reconnecting: false,
    error: null,
  });
  const eventListeners = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  useEffect(() => {
    if (!user || !tenant || !token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        baseListenersAttached = false;
        baseHandlers = [];
      }
      setState({ connected: false, socket: null, reconnecting: false, error: null });
      return;
    }

    subscriberCount += 1;

    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20_000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    } else if (socketInstance.auth?.token !== token) {
      socketInstance.auth = { ...(socketInstance.auth ?? {}), token };
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
    }

    const socket = socketInstance;
    setState(prev => ({ ...prev, socket }));

    const handleConnect = () => {
      setState(prev => ({ ...prev, connected: true, reconnecting: false, error: null, socket }));
      socket.emit('join:tenant', { tenantId: tenant._id ?? tenant.id });
      socket.emit('join:user', { userId: user._id ?? user.id });
    };

    const handleDisconnect = (reason: string) => {
      setState(prev => ({ ...prev, connected: false }));
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const handleReconnectAttempt = () => {
      setState(prev => ({ ...prev, reconnecting: true }));
    };

    const handleConnectError = (error: Error) => {
      setState(prev => ({ ...prev, error: error.message, reconnecting: false }));
      toast.error('Unable to connect to realtime service.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('connect_error', handleConnectError);

    if (!baseListenersAttached) {
      const notificationHandler = (data: { message: string; type?: 'success' | 'error' | 'info' }) => {
        const { message, type } = data;
        if (type === 'success') {
          toast.success(message);
        } else if (type === 'error') {
          toast.error(message);
        } else {
          toast(message);
        }
      };

      const agentExecutionHandler = (data: AgentExecutionEvent) => {
        if (data.status === 'FAILED') {
          toast.error(`Agent execution failed${data.step ? ` at ${data.step}` : ''}`);
        }
      };

      const transactionStatusHandler = (payload: { status: string }) => {
        const statusMessages: Record<string, string> = {
          COMPLETED: 'Transaction completed successfully',
          FAILED: 'Transaction failed',
          PENDING: 'Transaction is pending',
          PROCESSING: 'Transaction is processing',
        };

        const message = statusMessages[payload.status] ?? 'Transaction status updated';
        if (payload.status === 'COMPLETED') {
          toast.success(message);
        } else if (payload.status === 'FAILED') {
          toast.error(message);
        } else {
          toast(message);
        }
      };

      const mandateHandler = (data: { type: string }) => {
        toast(`New mandate created for ${data.type}`, { icon: '📝' });
      };

      baseHandlers = [
        { event: 'notification', handler: notificationHandler },
        { event: 'agent:execution:event', handler: agentExecutionHandler },
        { event: 'transaction:status:updated', handler: transactionStatusHandler },
        { event: 'mandate:created', handler: mandateHandler },
      ];

      baseHandlers.forEach(({ event, handler }) => socket.on(event, handler));
      baseListenersAttached = true;
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('connect_error', handleConnectError);

      subscriberCount = Math.max(subscriberCount - 1, 0);

      if (subscriberCount === 0 && socketInstance) {
        baseHandlers.forEach(({ event, handler }) => socketInstance?.off(event, handler));
        baseHandlers = [];
        baseListenersAttached = false;
        socketInstance.disconnect();
        socketInstance = null;
        setState({ connected: false, socket: null, reconnecting: false, error: null });
      }
    };
  }, [tenant, token, user]);

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (!socketInstance) {
        return () => {};
      }

      const listeners = eventListeners.current.get(event) ?? [];
      listeners.push(callback);
      eventListeners.current.set(event, listeners);
      socketInstance.on(event, callback);

      return () => {
        socketInstance?.off(event, callback);
        const updated = eventListeners.current.get(event)?.filter(listener => listener !== callback) ?? [];
        if (updated.length === 0) {
          eventListeners.current.delete(event);
        } else {
          eventListeners.current.set(event, updated);
        }
      };
    },
    []
  );

  const emit = useCallback((event: string, data: any) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(event, data);
    }
  }, []);

  return {
    ...state,
    isConnected: state.connected,
    subscribe,
    emit,
  };
};

export default useWebSocket;
