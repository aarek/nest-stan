import { Test, TestingModule } from '@nestjs/testing';
import {
  AsyncStanSubscribe,
  IMessageHandlerContext,
  InjectPublisher,
  IStanPublisher,
  IStanSubscriber,
  NestStanModule,
  StanSubscribe,
  MessageParser,
} from '../../src';

const testHandler = jest.fn();
const customParserHandler = jest.fn();
const testAsyncHandler = jest.fn().mockResolvedValue(undefined);
const customParserAsyncHandler = jest.fn().mockResolvedValue(undefined);

interface TestMessage {
  id: string;
  body: string;
  date: Date;
}

const messageParser: MessageParser = (data) => {
  const parsed = JSON.parse(data.toString());
  return {
    ...parsed,
    date: new Date(parsed.date),
  };
};

@StanSubscribe('subject', {
  setupSubscription: (builder) => builder.setStartWithLastReceived(),
})
class Subscriber implements IStanSubscriber<TestMessage> {
  handle(message: TestMessage, context: IMessageHandlerContext): void {
    testHandler(message);
  }
}

@StanSubscribe('subject', {
  setupSubscription: (builder) => builder.setStartWithLastReceived(),
  messageParser,
})
class CustomParserSubscriber implements IStanSubscriber<TestMessage> {
  handle(message: TestMessage, context: IMessageHandlerContext): void {
    customParserHandler(message);
  }
}

@AsyncStanSubscribe('subject', {
  setupSubscription: (builder) => builder.setStartWithLastReceived(),
})
class AsyncSubscriber implements IStanSubscriber<TestMessage> {
  async handle(message: TestMessage, context: IMessageHandlerContext): Promise<void> {
    await testAsyncHandler(message);
  }
}

@AsyncStanSubscribe('subject', {
  setupSubscription: (builder) => builder.setStartWithLastReceived(),
  messageParser,
})
class CustomParserAsyncSubscriber implements IStanSubscriber<TestMessage> {
  async handle(message: TestMessage, context: IMessageHandlerContext): Promise<void> {
    await customParserAsyncHandler(message);
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
      providers: [
        Subscriber,
        AsyncSubscriber,
        CustomParserSubscriber,
        CustomParserAsyncSubscriber,
        Publisher,
      ],
    }).compile();

    jest.resetAllMocks();
    await testingModule.init();

    publisher = testingModule.get(Publisher);
  });

  afterEach(() => testingModule.close());

  it('handles received message', async (done) => {
    const date = new Date()

    const firstMessage = { id: '1', body: 'testMessage-1', date };
    const secondMessage = { id: '2', body: 'testMessage-2', date };

    const prepareExpectedMessage = (message: any) => JSON.parse(JSON.stringify(message));

    await publisher.publish(firstMessage);
    await publisher.publish(secondMessage);

    setTimeout(() => {
      expect(testHandler).toHaveBeenCalledTimes(2);
      expect(testHandler).toHaveBeenCalledWith(prepareExpectedMessage(firstMessage));
      expect(testHandler).toHaveBeenCalledWith(prepareExpectedMessage(secondMessage));

      expect(testAsyncHandler).toHaveBeenCalledTimes(2);
      expect(testAsyncHandler).toHaveBeenCalledWith(prepareExpectedMessage(firstMessage));
      expect(testAsyncHandler).toHaveBeenCalledWith(prepareExpectedMessage(secondMessage));

      expect(customParserHandler).toHaveBeenCalledTimes(2);
      expect(customParserHandler).toHaveBeenCalledWith(firstMessage);
      expect(customParserHandler).toHaveBeenCalledWith(secondMessage);

      expect(customParserAsyncHandler).toHaveBeenCalledTimes(2);
      expect(customParserAsyncHandler).toHaveBeenCalledWith(firstMessage);
      expect(customParserAsyncHandler).toHaveBeenCalledWith(secondMessage);

      done();
    }, 50);
  });
});
