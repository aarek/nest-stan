import {
  ConnectionStatus,
  ConnectionStatusIndicator,
  ConnectionStatusSubscriber,
} from '../interfaces';

export class StanConnectionStatusMonitor implements ConnectionStatusIndicator, ConnectionStatusSubscriber {
  private _status: ConnectionStatus = ConnectionStatus.CONNECTING;
  private _lastStatusChange?: Date;
  private _lastError?: string;

  connected(): void {
    this.changeStatusTo(ConnectionStatus.CONNECTED);
    this._lastError = undefined;
  }

  reconnecting(): void {
    this.changeStatusTo(ConnectionStatus.RECONNECTING);
    this._lastError = undefined;
  }

  disconnected(message?: string | undefined): void {
    this.changeStatusTo(ConnectionStatus.DISCONNECTED);
    if (message) this._lastError = message;
  }

  getStatus(): ConnectionStatus {
    return this._status;
  }

  lastError(): string | undefined {
    return this._lastError;
  }

  lastStatusChange(): Date | undefined {
    return this._lastStatusChange;
  }

  private changeStatusTo(newStatus: ConnectionStatus): void {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this._lastStatusChange = new Date();
    }
  }
}
