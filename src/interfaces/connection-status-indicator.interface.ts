export enum ConnectionStatus {
  CONNECTING,
  RECONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export interface ConnectionStatusIndicator {
  getStatus(): ConnectionStatus;
  lastError(): string | undefined;
  lastStatusChange(): Date | undefined;
}

export const CONNECTION_STATUS_INDICATOR = Symbol('ConnectionStatusIndicator');
