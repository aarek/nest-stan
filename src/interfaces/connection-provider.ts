import { Stan, StanOptions } from 'node-nats-streaming';

export type StanConnectionProvider = (clusterID: string, clientID: string, opts?: StanOptions) => Stan

export const STAN_CONNECTION_PROVIDER = Symbol('StanConnectionProvider');
