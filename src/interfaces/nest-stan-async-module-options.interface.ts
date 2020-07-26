import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { ConnectionStatusSubscriber } from './connection-status-subscriber.interface';
import { NestStanConnectionOptions } from './nest-stan-connection-options.interface';

export interface UseFactory<T> {
  useFactory: (...args: any[]) => Promise<T> | T;
  inject?: any[];
}
export interface UseClass<T> {
  useClass: Type<T>;
}

export type ConfigProvider = UseFactory<NestStanConnectionOptions> | UseFactory<NestStanConnectionOptions>;
export type ConnectionStatusSubscriberProvider =
  | UseFactory<ConnectionStatusSubscriber>
  | UseClass<ConnectionStatusSubscriber>;

export interface NestStanAsyncModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<NestStanConnectionOptions> | NestStanConnectionOptions;
  inject?: any[];
  useClass?: Type<NestStanConnectionOptions>;
}
