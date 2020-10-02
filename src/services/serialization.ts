import { MessageParser } from '../interfaces';

export const parseMessage: MessageParser = (data) => JSON.parse(data.toString());
