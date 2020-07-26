import { Inject } from '@nestjs/common';
import { CONNECTION_STATUS_INDICATOR } from '../interfaces';

export const InjectConnectionStatusIndicator = () => Inject(CONNECTION_STATUS_INDICATOR);
