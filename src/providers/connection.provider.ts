import { connect } from 'node-nats-streaming';
import { STAN_CONNECTION_PROVIDER } from '../interfaces';

export const connectionProvider = {
  provide: STAN_CONNECTION_PROVIDER,
  useValue: connect,
};
