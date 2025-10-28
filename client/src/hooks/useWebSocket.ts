import { useWebSocket as useWebSocketContext } from '@context/WebSocketContext';

export const useWebSocket = () => {
  return useWebSocketContext();
};
