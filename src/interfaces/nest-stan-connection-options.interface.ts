import { StanOptions } from 'node-nats-streaming';

export interface NestStanConnectionOptions {
  clusterId: string;
  clientId: string;
  stanOptions: StanOptions
}

export const NEST_STAN_CONFIG_KEY = Symbol('NestStanConnectionOptions')
