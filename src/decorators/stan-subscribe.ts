import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';
import { OptionsBuilder } from '../interfaces';
import { STAN_SUBSCRIBE } from './constants';

const defaultOptionsBuilder: OptionsBuilder = (so) => so.setStartWithLastReceived();

export const StanSubscribe = (subject: string, optionsBuilder?: OptionsBuilder) =>
  applyDecorators(
    Injectable(),
    SetMetadata(STAN_SUBSCRIBE, {
      subject,
      optionsBuilder: optionsBuilder || defaultOptionsBuilder,
    }),
  );

export const AsyncStanSubscribe = (
  subject: string,
  optionsBuilder?: OptionsBuilder,
) =>
  applyDecorators(
    Injectable(),
    SetMetadata(STAN_SUBSCRIBE, {
      subject,
      optionsBuilder: optionsBuilder || defaultOptionsBuilder,
      async: true,
    }),
  );
