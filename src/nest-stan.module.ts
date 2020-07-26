import { DynamicModule, Module } from '@nestjs/common';
import { NestStanAsyncModuleOptions, NestStanConnectionOptions } from './interfaces';
import { NestStanCoreModule } from './nest-stan-core.module';
import { createPublisherProviders } from './providers';

@Module({})
export class NestStanModule {
  static forRoot(options: NestStanConnectionOptions): DynamicModule {
    return {
      module: NestStanModule,
      imports: [NestStanCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: NestStanAsyncModuleOptions): DynamicModule {
    return {
      module: NestStanModule,
      imports: [NestStanCoreModule.forRootAsync(options)],
    };
  }

  static forSubjects(subjects: string[]): DynamicModule {
    const providers = createPublisherProviders(subjects);

    return {
      module: NestStanModule,
      providers: [...providers],
      exports: [...providers],
    };
  }
}
