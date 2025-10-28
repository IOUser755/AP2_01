import { useWebSocketContext } from '../context/WebSocketContext.tsx';

export function useWebSocket() {
  return useWebSocketContext();
}
