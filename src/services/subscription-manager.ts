import { Stan } from 'node-nats-streaming';
import { AbstractSubscriptionManager, Context } from './abstract-subscription-manager';

export class SubscriptionManager extends AbstractSubscriptionManager {
  async start(stan: Stan): Promise<void> {
    await this.setupSubscription(stan);
    this.setuphandler((data, msg) => {
      this.subscriber.handle(data, new Context(msg));
    });
  }
}
