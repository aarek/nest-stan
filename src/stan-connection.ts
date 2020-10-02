import { Inject, Logger } from '@nestjs/common';
import { Stan, StanOptions } from 'node-nats-streaming';
import { ConnectionError } from './connection.error';
import {
  ConnectionStatusSubscriber,
  IStanSubscriber,
  NestStanConnectionOptions,
  NEST_STAN_CONFIG_KEY,
  StanConnectionProvider,
  STAN_CONNECTION_PROVIDER,
  SubscriberConfig,
} from './interfaces';
import {
  AbstractSubscriptionManager,
  AsyncSubscriptionManager,
  SubscriptionManager,
} from './services';

export class StanConnection {
  private readonly subscriptions: Array<AbstractSubscriptionManager> = [];
  private readonly connectionStatusSubscribers: Array<ConnectionStatusSubscriber> = [];
  private stan: Stan | undefined = undefined;

  constructor(
    @Inject(STAN_CONNECTION_PROVIDER) private readonly connectionProvider: StanConnectionProvider,
    @Inject(NEST_STAN_CONFIG_KEY) private readonly connectionOptions: NestStanConnectionOptions,
    private readonly logger: Logger,
  ) {}

  public async init(): Promise<void> {
    await this.connect();
    await this.connectSubscribers();
    this.setupConnectionHandlers();
  }

  public async close(): Promise<void> {
    await Promise.all(this.subscriptions.map((subscription) => subscription.unsubscribeAndClose()));

    if (this.stan) this.stan.close();

    this.stan = undefined;
  }

  public registerSubscriber<T>(
    subject: string,
    config: SubscriberConfig,
    subscriber: IStanSubscriber<T>,
  ): void {
    this.addSubscription(new SubscriptionManager(subject, config.setupSubscription, subscriber));
    this.logger.log(`Registered ${subscriber.constructor.name} {${subject}}`);
  }

  public registerAsyncSubscriber<T>(
    subject: string,
    config: SubscriberConfig,
    subscriber: IStanSubscriber<T>,
  ): void {
    this.addSubscription(new AsyncSubscriptionManager(subject, config.setupSubscription, subscriber));
    this.logger.log(`Registered ${subscriber.constructor.name} {${subject}, async}`);
  }

  public registerConnectionStatusSubscriber(subscriber: ConnectionStatusSubscriber): void {
    this.connectionStatusSubscribers.push(subscriber);
  }

  public publish(subject: string, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.assertConnected(this.stan);
        this.stan.publish(subject, message, (err, guid) => {
          if (err) return reject(err);

          return resolve(guid);
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  private addSubscription(subscriptionManager: AbstractSubscriptionManager): void {
    this.subscriptions.push(subscriptionManager);
  }

  private async connect(): Promise<void> {
    const stan = this.connectionProvider(this.clusterId, this.clientId, this.stanConfig);

    const connectionPromise = new Promise((resolve, reject) => {
      const handleConnected = () => {
        this.logger.log(`Connected to NATS Streaming Server at ${this.stanConfig.url}`);
        this.notifyConnected();
        stan.removeListener('error', handleConnectionError);
        return resolve();
      };

      const handleConnectionError = (error: Error) => {
        stan.removeListener('connect', handleConnected);
        return reject(
          new ConnectionError(
            `Couldn't connect to nats streaming server at ${this.stanConfig.url}`,
            error,
          ),
        );
      };

      stan.once('connect', handleConnected);
      stan.once('error', handleConnectionError);
    });

    await connectionPromise;

    this.stan = stan;
  }

  private setupConnectionHandlers() {
    this.assertConnected(this.stan);

    this.stan.on('disconnect', () => this.notifyDisconnected());
    this.stan.on('reconnect', () => this.notifyConnected());
    this.stan.on('reconnecting', () => this.notifyReconnecting());

    this.stan.on('close', () => {
      this.logger.log('Connection closed');
      this.notifyDisconnected();
    });

    this.stan.on('connection_lost', (error) => {
      this.logger.error(`Disconnected from NATS Streaming Server (${error.message})`);
      this.logger.error(error);
      this.notifyDisconnected(error.message);
    });

    this.stan.on('error', (error) => error.code !== 'CONN_ERR' && this.logger.error(error));
  }

  private async connectSubscribers() {
    const stan = this.stan;
    this.assertConnected(stan);

    await Promise.all(this.subscriptions.map((subscription) => subscription.start(stan)));
  }

  private assertConnected(stan: Stan | undefined): asserts stan is Stan {
    if (!stan) throw new ConnectionError('Not connected to NATS streaming server');
  }

  private notifyConnected() {
    this.connectionStatusSubscribers.forEach((subscriber) => subscriber.connected());
  }

  private notifyDisconnected(message?: string) {
    this.connectionStatusSubscribers.forEach((subscriber) => subscriber.disconnected(message));
  }

  private notifyReconnecting() {
    this.connectionStatusSubscribers.forEach((subscriber) => subscriber.reconnecting());
  }

  private get stanConfig(): StanOptions {
    return this.connectionOptions.stanOptions;
  }

  private get clusterId(): string {
    return this.connectionOptions.clusterId;
  }

  private get clientId(): string {
    return this.connectionOptions.clientId;
  }
}
