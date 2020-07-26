import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import {
  ConnectionStatusSubscriber,
  CONNECTION_STATUS_INDICATOR,
  NestStanAsyncModuleOptions,
  NestStanConnectionOptions,
  NEST_STAN_CONFIG_KEY,
} from './interfaces';
import { connectionProvider, connectionStatusIndicatorProvider, loggerProvider } from './providers';
import { SubscribersExplorer } from './services';
import { StanConnection } from './stan-connection';

@Global()
@Module({})
export class NestStanCoreModule implements OnModuleInit, OnModuleDestroy {
  static forRoot(options: NestStanConnectionOptions): DynamicModule {
    return {
      module: NestStanCoreModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: NEST_STAN_CONFIG_KEY,
          useValue: options,
        },
        loggerProvider,
        connectionProvider,
        connectionStatusIndicatorProvider,
        StanConnection,
        SubscribersExplorer,
      ],
      exports: [StanConnection, connectionStatusIndicatorProvider],
    };
  }

  static forRootAsync(options: NestStanAsyncModuleOptions): DynamicModule {
    return {
      module: NestStanCoreModule,
      providers: [
        loggerProvider,
        connectionProvider,
        connectionStatusIndicatorProvider,
        StanConnection,
        SubscribersExplorer,
        this.createAsyncConfigProvider(options),
      ],
      imports: (options.imports || []).concat([DiscoveryModule]),
      exports: [StanConnection, connectionStatusIndicatorProvider],
    };
  }

  private static createAsyncConfigProvider(options: NestStanAsyncModuleOptions): Provider {
    if (options.useFactory) {
      return {
        provide: NEST_STAN_CONFIG_KEY,
        inject: options.inject,
        useFactory: options.useFactory,
      };
    }

    return {
      provide: NEST_STAN_CONFIG_KEY,
      useClass: options.useClass!,
    };
  }

  constructor(
    private readonly stanConnection: StanConnection,
    private readonly subscribersExplorer: SubscribersExplorer,
    @Inject(CONNECTION_STATUS_INDICATOR)
    private readonly connectionStatusSubscriber: ConnectionStatusSubscriber,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscribersExplorer.setupSubscribers(this.stanConnection);
    this.stanConnection.registerConnectionStatusSubscriber(this.connectionStatusSubscriber);

    await this.stanConnection.init();
  }

  async onModuleDestroy(): Promise<void> {
    this.stanConnection.close();
  }
}
