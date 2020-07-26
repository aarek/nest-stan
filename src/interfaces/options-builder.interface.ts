import { SubscriptionOptions } from 'node-nats-streaming';

export type OptionsBuilder = (options: SubscriptionOptions) => SubscriptionOptions;
