import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
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

const initialState: WebSocketState = {
  connected: false,
  socket: null,
  reconnecting: false,
  error: null,
};

let sharedState: WebSocketState = initialState;
let socketInstance: Socket | null = null;
let currentTenantId: string | null = null;
let currentToken: string | null = null;
let subscriberCount = 0;

const subscribers = new Set<Dispatch<SetStateAction<WebSocketState>>>();
const eventListeners = new Map<string, Array<(data: any) => void>>();

const notifySubscribers = () => {
  subscribers.forEach(setState => {
    setState(sharedState);
  });
};

const updateSharedState = (updater: WebSocketState | ((prev: WebSocketState) => WebSocketState)) => {
  sharedState = typeof updater === 'function' ? (updater as (prev: WebSocketState) => WebSocketState)(sharedState) : updater;
  notifySubscribers();
};

const attachSavedListeners = () => {
  if (!socketInstance) {
    return;
  }

  eventListeners.forEach((listeners, event) => {
    listeners.forEach(listener => {
      socketInstance?.on(event, listener);
    });
  });
};

const cleanupSocket = (preserveListeners = false) => {
  if (socketInstance) {
    eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        socketInstance?.off(event, listener);
      });
    });
    socketInstance.disconnect();
    socketInstance = null;
  }

  currentTenantId = null;
  currentToken = null;
  if (!preserveListeners) {
    eventListeners.clear();
  }
  updateSharedState(initialState);
};

const initializeSocket = (tenantId: string, token: string, userId: string | null) => {
  if (socketInstance && currentTenantId === tenantId && currentToken === token) {
    return;
  }

  if (socketInstance) {
    cleanupSocket(true);
  }

  const socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000', {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstance = socket;
  currentTenantId = tenantId;
  currentToken = token;

  updateSharedState(prev => ({ ...prev, socket }));

  socket.on('connect', () => {
    updateSharedState(prev => ({ ...prev, connected: true, error: null, reconnecting: false, socket }));
    // eslint-disable-next-line no-console
    console.log('✅ WebSocket connected');
    socket.emit('join:tenant', { tenantId });
    if (userId) {
      socket.emit('join:user', { userId });
    }
  });

  attachSavedListeners();

  socket.on('disconnect', reason => {
    updateSharedState(prev => ({ ...prev, connected: false }));
    // eslint-disable-next-line no-console
    console.log('❌ WebSocket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.on('reconnect_attempt', () => {
    updateSharedState(prev => ({ ...prev, reconnecting: true }));
  });

  socket.on('reconnect', () => {
    updateSharedState(prev => ({ ...prev, reconnecting: false, error: null }));
    toast.success('Realtime connection restored');
  });

  socket.on('connect_error', error => {
    updateSharedState(prev => ({ ...prev, error: error.message, reconnecting: false }));
    // eslint-disable-next-line no-console
    console.error('WebSocket connection error:', error);
    toast.error('Unable to establish realtime connection');
  });

  socket.on('agent:execution:event', (event: AgentExecutionEvent) => {
    if (event.status === 'FAILED') {
      toast.error(`Agent execution failed at step ${event.step}`);
    }
  });
};

export const useWebSocket = () => {
  const { user, token, tenant } = useAuth();
  const [state, setState] = useState<WebSocketState>(sharedState);

  useEffect(() => {
    subscriberCount += 1;
    subscribers.add(setState);
    setState(sharedState);

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      subscribers.delete(setState);
      if (subscriberCount === 0) {
        cleanupSocket();
      }
    };
  }, []);

  useEffect(() => {
    if (!tenant || !token || !user) {
      if (socketInstance) {
        cleanupSocket();
      }
      return;
    }

    const tenantId = tenant._id ?? tenant.id;
    const userId = user._id ?? user.id ?? null;

    if (tenantId && token) {
      initializeSocket(tenantId, token, userId);
    }
  }, [tenant, token, user]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    const listeners = eventListeners.get(event) ?? [];
    listeners.push(callback);
    eventListeners.set(event, listeners);

    if (socketInstance) {
      socketInstance.on(event, callback);
    }

    return () => {
      const updated = (eventListeners.get(event) ?? []).filter(listener => listener !== callback);
      if (updated.length === 0) {
        eventListeners.delete(event);
      } else {
        eventListeners.set(event, updated);
      }

      socketInstance?.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (sharedState.connected && socketInstance) {
      socketInstance.emit(event, data);
    }
  }, []);

  return {
    ...state,
    subscribe,
    emit,
  };
};
