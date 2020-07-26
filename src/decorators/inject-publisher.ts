import { Inject } from '@nestjs/common';

export const subjects: Set<string> = new Set<string>();

export const createProviderKey = (subject: string) => `NestStanPublisher[${subject}]`

export const InjectPublisher = (subject: string) => {
  subjects.add(subject);

  return Inject(createProviderKey(subject))
}

