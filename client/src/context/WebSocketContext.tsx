import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { WebSocketEvent } from '@types/websocket';

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, payload?: unknown) => void;
  subscribe: (event: string, handler: (data: WebSocketEvent) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:5000';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    const syncToken = () => {
      setAuthToken(localStorage.getItem('token'));
    };

    window.addEventListener('storage', syncToken);
    window.addEventListener('focus', syncToken);

    return () => {
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('focus', syncToken);
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!authToken) {
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: authToken,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [authToken]);

  const value = useMemo<WebSocketContextValue>(() => ({
    socket: socketRef.current,
    isConnected,
    emit: (event, payload) => {
      socketRef.current?.emit(event, payload);
    },
    subscribe: (event, handler) => {
      const listener = (data: WebSocketEvent) => handler(data);
      socketRef.current?.on(event, listener);
      return () => {
        socketRef.current?.off(event, listener);
      };
    },
  }), [isConnected, authToken]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
