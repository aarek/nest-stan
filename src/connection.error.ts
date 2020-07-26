export class ConnectionError extends Error {
  private readonly natsError?: Error;

  constructor(message: string, natsError?: Error) {
    super(message);
    this.natsError = natsError;
    this.name = ConnectionError.name;
  }
}
