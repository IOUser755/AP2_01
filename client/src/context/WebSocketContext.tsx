import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

import { useAuthContext } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data?: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

const MAX_RECONNECT_ATTEMPTS = 5;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated, user, tenant } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const socketUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:5000';

  useEffect(() => {
    if (!isAuthenticated || !user || !tenant) {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token = authToken();
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      auth: {
        token,
        userId: user._id ?? user.id,
        tenantId: tenant._id ?? tenant.id,
      },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      newSocket.emit('join:tenant', tenant._id ?? tenant.id);
      newSocket.emit('join:user', user._id ?? user.id);
    });

    newSocket.on('disconnect', reason => {
      console.warn('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        toast.error(`Connection lost. Retrying... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
      } else {
        toast.error('Unable to establish realtime connection. Please refresh the page.');
      }
    });

    // Generic notifications
    newSocket.on('notification', data => {
      toast(data.message, {
        icon: data.type === 'success' ? '✅' : data.type === 'error' ? '❌' : '🔔',
      });
    });

    newSocket.on('agent:execution:started', data => {
      toast.success(`Agent "${data.agentName}" execution started`);
    });

    newSocket.on('agent:execution:completed', data => {
      if (data.success) {
        toast.success(`Agent "${data.agentName}" completed successfully`);
      } else {
        toast.error(`Agent "${data.agentName}" execution failed`);
      }
    });

    newSocket.on('transaction:status:updated', data => {
      const statusMessages: Record<string, string> = {
        COMPLETED: 'Transaction completed successfully',
        FAILED: 'Transaction failed',
        PENDING: 'Transaction is pending',
        PROCESSING: 'Transaction is processing',
      };

      const message = statusMessages[data.status] ?? 'Transaction status updated';
      const type = data.status === 'COMPLETED' ? 'success' : data.status === 'FAILED' ? 'error' : 'default';

      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      } else {
        toast(message);
      }
    });

    newSocket.on('mandate:created', data => {
      toast(`New mandate created for ${data.type}`, { icon: '📝' });
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, socket, tenant, user, socketUrl]);

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!socket) {
      console.warn('Socket not connected. Unable to subscribe to event:', event);
      return () => {};
    }

    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  };

  const emit = (event: string, data?: any) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected. Unable to emit event:', event);
      return;
    }

    socket.emit(event, data);
  };

  const joinRoom = (roomId: string) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected. Unable to join room:', roomId);
      return;
    }

    socket.emit('join:room', roomId);
  };

  const leaveRoom = (roomId: string) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected. Unable to leave room:', roomId);
      return;
    }

    socket.emit('leave:room', roomId);
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribe,
    emit,
    joinRoom,
    leaveRoom,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

function authToken() {
  return localStorage.getItem('token');
}
