import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { ServiceEventsService } from './service-events.service';

@ApiTags('service-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-events')
export class ServiceEventsController {
  constructor(private readonly serviceEvents: ServiceEventsService) {}
}
