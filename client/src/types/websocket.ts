export interface WebSocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: string;
}
