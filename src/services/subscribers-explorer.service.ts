import { Injectable, Type } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { STAN_SUBSCRIBE } from '../decorators/constants';
import { IStanSubscriber } from '../interfaces';
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
        const { subject, optionsBuilder, async } = this.getMetadata(metatype);

        async
          ? connection.registerAsyncSubscriber(subject, optionsBuilder, instance)
          : connection.registerSubscriber(subject, optionsBuilder, instance);
      });
  }

  private isStanSubscriber(target: Type<any> | Function): boolean {
    if (!target) {
      return false;
    }

    return !!this.getMetadata(target);
  }

  private getMetadata(target: Type<any> | Function): any {
    return this.reflector.get(STAN_SUBSCRIBE, target);
  }
}
