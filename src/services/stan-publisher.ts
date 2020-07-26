import { IStanPublisher } from '../interfaces';
import { StanConnection } from '../stan-connection';

export class StanPublisher<T> implements IStanPublisher<T> {
  constructor(
    private readonly stanConnection: StanConnection,
    private readonly subject: string,
  ) {}

  publish(message: T): Promise<string> {
    return this.stanConnection.publish(this.subject, JSON.stringify(message))
  }
}
