import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WebSocketEvent } from '../types/websocket.ts';

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
      return () => undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: authToken,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authToken]);

  const emit = (event: string, payload?: unknown) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit(event, payload);
  };

  const subscribe = (event: string, handler: (data: WebSocketEvent) => void) => {
    if (!socketRef.current) return () => undefined;

    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  };

  const value = useMemo<WebSocketContextValue>(
    () => ({
      socket: socketRef.current,
      isConnected,
      emit,
      subscribe,
    }),
    [isConnected]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
