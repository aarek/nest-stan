export interface IStanPublisher<T> {
  publish(message: T): Promise<string>;
}
