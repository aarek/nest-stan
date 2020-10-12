# @aarek/nest-stan

## Table of Contents

- [Description](#description)
- [Usage](#usage)
  - [Install](#install)
  - [Module Initialization](#module-initialization)
- [Handling Messages](#handling-messages)
- [Publishing Messages](#publishing-messages)
- [Connection Status](#connection-status)
- [ToDo](#todo)

### Description

Wrapper around [node-nats-streaming](https://www.npmjs.com/package/node-nats-streaming) for [NestJS](https://github.com/nestjs/nest).

### Usage

#### Install

`npm install --save @aarek/nest-stan`

or

`yarn add @aarek/nest-stan`

#### Module initialization

```typescript
@Module({
  imports: [
    NestStanModule.forRoot({
      clientId: 'client-id-test1',
      clusterId: 'test-cluster',
      stanOptions: {
        url: 'nats://localhost:4222'
      }
    })
  ]
})
export class AppModule {}
```

or

```typescript
@Module({
  imports: [
    NestStanModule.forRootAsync({
      imports: [ConfigModule]
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.nestStanConfig(),
    }),
  ]
})
export class AppModule {}
```

### Handling messages

Nest Stan gives you two decorators `StanSubscribe` and `AsyncStanSubscribe`. `AsyncStanSubscribe` will automatically acknowledge message after successful `Promise` resolve.
Both decorators accepts `subject` as first argument and optional config as second argument. Config object has two keys:
- `setupSubscription` - function accepting `node-nats-streaming` `SubscriptionOptions` and returning `SubscriptionOptions`
- `messageParser` - function accepting `String` or `Buffer` and returning parsed object

ex.:

```typescript
@StanSubscribe('subject', {
    setupSubscription: options =>
      options.setStartAtTimeDelta(30 * 1000),
    messageParser: (data) => JSON.parse(data.toString()),
  },
)
export class Subscriber implements IStanSubscriber<Message> {
  handle(message: Message, context: IMessageHandlerContext): void {
    // Handle message
    return;
  }
}
```

```typescript
@AsyncStanSubscribe('subject', {
    setupSubscription: options =>
      options
        .setStartAtTimeDelta(30 * 1000)
        .setDurableName(AsyncSubscriber.name),
    messageParser: (data) => JSON.parse(data.toString()),
  },
)
export class AsyncSubscriber implements IStanSubscriber<Message> {
  async handle(message: Message, context: IMessageHandlerContext): Promise<void> {
    // Handle message
    return;
  }
}
```

### Publishing messages

In order to publish messages you first need to import `NestStanModule` for subjects that you would like to publish to:

```typescript
@Module({
  imports: [NestStanModule.forSubjects(['subject'])],
  controllers: [TestController],
  providers: [],
})
export class TestModule {}
```

Nest Stan provides you with `InjectPublisher` decorator to inject publishers:

```typescript
@Controller()
class TestController {
  constructor(
    @InjectPublisher('subject') private readonly publisher: IStanPublisher<Message>,
  ) {}

  @Post()
  async publishMessage() {
    const message: Message = {
      foo: 'bar',
    }

    await this.publisher.publish(message)
  }
}
```

### Connection status

In order to check what is the current status of connection you can use `InjectConnectionStatusIndicator`:

```typescript
@Injectable()
export class StanConnectionIndicator extends HealthIndicator {
  constructor(
    @InjectConnectionStatusIndicator() private readonly connectionStatus: ConnectionStatusIndicator
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = this.connectionStatus.getStatus() === ConnectionStatus.CONNECTED;
    const lastError = this.connectionStatus.lastError()

    return this.getStatus(key, isHealthy, { lastError });
  }
}
```

### ToDo

- [ ] Add linter
- [ ] Add classes documentation
- [ ] Implement github actions
- [ ] Collect coverage
- [ ] Provide example app
