import { Test, TestingModule } from '@nestjs/testing';
import {
  AsyncStanSubscribe,
  IMessageHandlerContext,
  InjectPublisher,
  IStanPublisher,
  IStanSubscriber,
  NestStanModule,
  StanSubscribe,
} from '../../src';

const testHandler = jest.fn();
const testAsyncHandler = jest.fn().mockResolvedValue(undefined);

interface TestMessage {
  id: string;
  body: string;
}

@StanSubscribe('subject', { setupSubscription: (builder) => builder.setStartWithLastReceived() })
class Subscriber implements IStanSubscriber<TestMessage> {
  handle(message: TestMessage, context: IMessageHandlerContext): void {
    testHandler(message);
  }
}

@AsyncStanSubscribe('subject', { setupSubscription: (builder) => builder.setStartWithLastReceived() })
class AsyncSubscriber implements IStanSubscriber<TestMessage> {
  async handle(message: TestMessage, context: IMessageHandlerContext): Promise<void> {
    await testAsyncHandler(message);
  }
}

class Publisher {
  constructor(
    @InjectPublisher('subject') private readonly publisher: IStanPublisher<TestMessage>,
  ) {}

  publish(message: TestMessage) {
    return this.publisher.publish(message);
  }
}

describe('StanSubscribe', () => {
  let testingModule: TestingModule;
  let publisher: Publisher;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        NestStanModule.forRoot({
          clientId: 'test-client-id',
          clusterId: 'test-cluster',
          stanOptions: { url: 'nats://localhost:4222' },
        }),
        NestStanModule.forSubjects(['subject']),
      ],
      providers: [Subscriber, AsyncSubscriber, Publisher],
    }).compile();

    jest.resetAllMocks();
    await testingModule.init();

    publisher = testingModule.get(Publisher);
  });

  afterEach(() => testingModule.close());

  it('handles received message', async (done) => {
    await publisher.publish({ id: '1', body: 'testMessage-1' });
    await publisher.publish({ id: '2', body: 'testMessage-2' });

    setTimeout(() => {
      expect(testHandler).toHaveBeenCalledTimes(2);
      expect(testHandler).toHaveBeenCalledWith({ id: '1', body: 'testMessage-1' });
      expect(testHandler).toHaveBeenCalledWith({ id: '2', body: 'testMessage-2' });

      expect(testAsyncHandler).toHaveBeenCalledTimes(2);
      expect(testAsyncHandler).toHaveBeenCalledWith({ id: '1', body: 'testMessage-1' });
      expect(testAsyncHandler).toHaveBeenCalledWith({ id: '2', body: 'testMessage-2' });

      done();
    }, 50);
  });
});
