import { Provider } from '@nestjs/common';
import { createProviderKey, subjects } from '../decorators';
import { IStanPublisher } from '../interfaces';
import { StanPublisher } from '../services/stan-publisher';
import { StanConnection } from '../stan-connection';

const publisherFactory = (subject: string) => (connection: StanConnection) =>
  new StanPublisher(connection, subject);

const createPublisherProvider = <T>(subject: string): Provider<IStanPublisher<T>> => ({
  provide: createProviderKey(subject),
  useFactory: publisherFactory(subject),
  inject: [StanConnection],
});

const intersect = (setA: Set<string>, setB: Set<string>): string[] =>
  [...setA].filter((s) => setB.has(s));

export const createPublisherProviders = (provideSubjects: string[]) =>
  Array.from(intersect(subjects, new Set(provideSubjects)), createPublisherProvider);
