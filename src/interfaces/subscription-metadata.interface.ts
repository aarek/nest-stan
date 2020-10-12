import { SubscriberConfig } from './subscriber-config.iterface';

export interface SubscribtionMetadata {
  subject: string;
  config: SubscriberConfig;
  async?: boolean;
}
