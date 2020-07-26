import { CONNECTION_STATUS_INDICATOR } from '../interfaces';
import { StanConnectionStatusMonitor } from '../services/stan-connection-status-monitor';

const stanConnectionStatusMonitor = new StanConnectionStatusMonitor();

export const connectionStatusIndicatorProvider = {
  provide: CONNECTION_STATUS_INDICATOR,
  useValue: stanConnectionStatusMonitor,
};
