import { Injectable, Type } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { STAN_SUBSCRIBE } from '../decorators/constants';
import { IStanSubscriber, SubscribtionMetadata } from '../interfaces';
import { StanConnection } from '../stan-connection';

@Injectable()
export class SubscribersExplorer {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  setupSubscribers(connection: StanConnection): void {
    this.discoveryService
      .getProviders()
      .filter((wrapper) => this.isStanSubscriber(wrapper.metatype))
      .forEach((wrapper: InstanceWrapper<IStanSubscriber>) => {
        const { instance, metatype } = wrapper;
        const { subject, config, async } = this.getMetadata(metatype);

        async
          ? connection.registerAsyncSubscriber(subject, config, instance)
          : connection.registerSubscriber(subject, config, instance);
      });
  }

  private isStanSubscriber(target: Type<any> | Function): boolean {
    if (!target) {
      return false;
    }

    return !!this.getMetadata(target);
  }

  private getMetadata(target: Type<any> | Function): SubscribtionMetadata {
    return this.reflector.get<SubscribtionMetadata, Symbol>(STAN_SUBSCRIBE, target);
  }
}
