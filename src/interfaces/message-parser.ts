export type MessageParser<T = any> = (data: String | Buffer) => T;
