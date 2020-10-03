import { OptionsBuilder } from './options-builder.interface';
import { MessageParser } from './message-parser';

export interface SubscriberConfig {
  setupSubscription: OptionsBuilder;
  messageParser: MessageParser;
}
