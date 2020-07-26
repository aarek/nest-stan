export interface IMessageHandlerContext {
  readonly originalMessageData: String | Buffer;
  readonly date: Date
  readonly isRedelivered: boolean
  readonly sequenceNo: number
  ack(): void
}
