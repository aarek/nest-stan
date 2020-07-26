import { IMessageHandlerContext } from './message-handler-context.interface';

export interface IStanSubscriber<T = any> {
  handle(message: T, context: IMessageHandlerContext): void | Promise<void>;
}
