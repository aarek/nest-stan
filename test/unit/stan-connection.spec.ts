jest.mock('node-nats-streaming');
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { StanOptions } from 'node-nats-streaming';
import { instance, mock } from 'ts-mockito';
import { ConnectionError } from '../../src/connection.error';
import {
  IMessageHandlerContext,
  IStanSubscriber,
  OptionsBuilder,
  StanConnectionProvider,
} from '../../src/interfaces';
import { StanConnection } from '../../src/stan-connection';

class FakeStanConnection extends EventEmitter {
  close = jest.fn();
  publish = jest.fn();
  subscribe = jest.fn();
  subscriptionOptions = jest.fn();
}

class EmptySubscriber implements IStanSubscriber {
  async handle(message: any, context: IMessageHandlerContext): Promise<void> {
    return;
  }
}

class FakeSubscription extends EventEmitter {
  isClosed = jest.fn().mockReturnValue(true);
  unsubscribe = jest.fn();
  close = jest.fn();
}

describe(StanConnection.name, () => {
  const loggerMock = mock(Logger);

  let fakeStanConnection: FakeStanConnection;
  let connectionProvider: StanConnectionProvider;
  let connection: StanConnection;

  beforeEach(() => {
    fakeStanConnection = new FakeStanConnection();
    connectionProvider = (_clusterID: string, _clientID: string, _opts?: StanOptions) =>
      fakeStanConnection;

    connection = new StanConnection(
      connectionProvider,
      { clientId: 'clientId', clusterId: 'clusterId', stanOptions: {} },
      instance(loggerMock),
    );
  });

  describe('init', () => {
    it('awaits for connect confirmation', (done) => {
      connection.init().then(() => done());
      fakeStanConnection.emit('connect');
    });

    it('rejects when connection attempt errors', (done) => {
      connection.init().catch((error) => {
        expect(error).toBeInstanceOf(ConnectionError);

        done();
      });

      fakeStanConnection.emit('error', { code: 'CONN_ERR' });
    });

    describe('with subscribers registered', () => {
      let fakeSubscription: FakeSubscription;

      beforeEach(() => {
        const subscriber = new EmptySubscriber();
        const optionsBuilder: OptionsBuilder = (builder) => builder;

        fakeSubscription = new FakeSubscription();
        fakeStanConnection.subscribe.mockReturnValue(fakeSubscription);

        connection.registerAsyncSubscriber('subject', optionsBuilder, subscriber);
      });

      xit('awaits for subscriptions being ready', (done) => {
        // TODO: Implement subscriptionOptions
        const promise = connection.init();
        fakeStanConnection.emit('connect');
        promise.then(() => done());

        fakeSubscription.emit('ready');
      });

      xit('throws when subscription errors upon starting', async () => {
        // TODO: Implement subscriptionOptions
        const promise = connection.init();
        fakeStanConnection.emit('connect');
        fakeSubscription.emit('error', {});

        await expect(promise).rejects.toThrow();
      });
    });
  });

  describe('publish', () => {
    it('publishes message to subject', (done) => {
      const message = 'message';
      const subject = 'subject.name';

      fakeStanConnection.publish.mockImplementationOnce((_subject, _message, callback) => {
        callback(undefined, 'guid');
      });

      connection.init().then(async () => {
        await connection.publish(subject, message);

        expect(fakeStanConnection.publish).toBeCalledTimes(1);
        expect(fakeStanConnection.publish).toHaveBeenCalledWith(
          subject,
          message,
          expect.any(Function),
        );

        done();
      });

      fakeStanConnection.emit('connect');
    });
  });

  describe('close', () => {
    it('closes stan connection', async (done) => {
      connection.init().then(async () => {
        await connection.close();

        expect(fakeStanConnection.close).toBeCalledTimes(1);

        done();
      });

      fakeStanConnection.emit('connect');
    });
  });
});
