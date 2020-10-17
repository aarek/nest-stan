import { Message, Stan, Subscription } from 'node-nats-streaming';
import { IMessageHandlerContext, IStanSubscriber, OptionsBuilder, MessageParser } from '../interfaces';
import { Logger } from '@nestjs/common';

type MessageHandler = (parsedData: any, msg: Message) => void;

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
  protected readonly loggerContext: string;

  constructor(
    private readonly logger: Logger,
    protected readonly subject: string,
    protected readonly optionsBuilder: OptionsBuilder,
    protected readonly messageParser: MessageParser,
    protected readonly subscriber: IStanSubscriber,
  ) {
    this.loggerContext = `${subscriber.constructor.name} (${subject})`
  }

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
    this.activeSubscription?.on('message', (msg: Message) => handler(this.parseMessage(msg), msg));
  }

  protected parseMessage(message: Message): any {
    return this.messageParser(message.getData());
  }

  protected log(message: any) {
    this.logger.log(message, this.loggerContext);
  }
   protected logError(message: any, stack: string) {
     this.logger.error(message, stack, this.loggerContext);
   }
}
