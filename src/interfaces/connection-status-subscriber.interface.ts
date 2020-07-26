export interface ConnectionStatusSubscriber {
  connected(): void;
  reconnecting(): void;
  disconnected(message?: string): void;
}

export const CONNECTION_STATUS_SUBSCRIBER = Symbol('ConnectionStatusSubscriber');
