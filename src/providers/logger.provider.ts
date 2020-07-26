import { Logger } from '@nestjs/common';

export const loggerProvider = {
  provide: Logger,
  useValue: new Logger('NestStanModule'),
};
