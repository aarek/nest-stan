import { Message, Stan, Subscription } from 'node-nats-streaming';
import { IMessageHandlerContext, IStanSubscriber, OptionsBuilder } from '../interfaces';

type MessageHandler = (msg: Message) => void;

export class Context implements IMessageHandlerContext {
  constructor(private readonly msg: Message) {}

  get originalMessageData(): String | Buffer {
    return this.msg.getData();
  }

  get date(): Date {
    return this.msg.getTimestamp();
  }

  get isRedelivered(): boolean {
    return this.msg.isRedelivered();
  }

  get sequenceNo(): number {
    return this.msg.getSequence();
  }

  public ack(): void {
    return this.msg.ack();
  }
}

export abstract class AbstractSubscriptionManager {
  protected activeSubscription: Subscription | undefined = undefined;

  constructor(
    protected readonly subject: string,
    protected readonly optionsBuilder: OptionsBuilder,
    protected readonly subscriber: IStanSubscriber,
  ) {}

  abstract start(stan: Stan): Promise<void>;

  unsubscribeAndClose(): Promise<void> {
    return new Promise((resolve, _reject) => {
      if (!this.activeSubscription) return resolve();

      try {
        this.activeSubscription.unsubscribe();
        this.activeSubscription.on('unsubscribed', () => {
          this.activeSubscription?.close();
          this.activeSubscription = undefined;

          return resolve();
        });
      } finally {
        return resolve();
      }
    });
  }

  protected setupSubscription(stan: Stan, optionsBuilder?: OptionsBuilder): Promise<void> {
    let subscriptionOptions = this.optionsBuilder(stan.subscriptionOptions());

    if (optionsBuilder) subscriptionOptions = optionsBuilder(subscriptionOptions);

    const subscription = stan.subscribe(this.subject, subscriptionOptions);

    return new Promise((resolve, reject) => {
      subscription.once('ready', () => {
        this.activeSubscription = subscription;
        return resolve();
      });

      subscription.once('error', reject);
    });
  }

  protected setuphandler(handler: MessageHandler) {
    this.activeSubscription?.on('message', handler);
  }
}
