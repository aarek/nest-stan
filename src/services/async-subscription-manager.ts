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
    this.setuphandler((msg) => {
      Promise.resolve(JSON.parse(msg.getData().toString()))
        .then((m) => this.subscriber.handle(m, new AsyncContext(msg)))
        .then(() => msg.ack());
    });
  }
}
