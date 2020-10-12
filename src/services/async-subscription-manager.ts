import { Stan } from 'node-nats-streaming';
import { AbstractSubscriptionManager, Context } from './abstract-subscription-manager';

class AsyncContext extends Context {
  public ack() {
    // noop - Async subscription acks message after handler resolves
  }
}

export class AsyncSubscriptionManager extends AbstractSubscriptionManager {
  async start(stan: Stan): Promise<void> {
    await this.setupSubscription(stan, (options) => options.setManualAckMode(true));
    this.setuphandler((data, msg) => {
      Promise.resolve()
        .then(() => this.subscriber.handle(data, new AsyncContext(msg)))
        .then(() => msg.ack());
    });
  }
}
