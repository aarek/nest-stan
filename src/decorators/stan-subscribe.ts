import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';
import { SubscriberConfig, SubscribtionMetadata } from '../interfaces';
import { STAN_SUBSCRIBE } from './constants';

const defaultConfig: SubscriberConfig = {
  setupSubscription: (so) => so.setStartWithLastReceived(),
  messageParser: (data) => JSON.parse(data.toString()),
};

export const StanSubscribe = (subject: string, config: Partial<SubscriberConfig> = {}) =>
  applyDecorators(
    Injectable(),
    SetMetadata<Symbol, SubscribtionMetadata>(STAN_SUBSCRIBE, {
      subject,
      config: { ...defaultConfig, ...config },
    }),
  );

export const AsyncStanSubscribe = (subject: string, config: Partial<SubscriberConfig> = {}) =>
  applyDecorators(
    Injectable(),
    SetMetadata<Symbol, SubscribtionMetadata>(STAN_SUBSCRIBE, {
      subject,
      config: { ...defaultConfig, ...config },
      async: true,
    }),
  );
