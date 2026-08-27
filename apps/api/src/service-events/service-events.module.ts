import { Module } from '@nestjs/common';

import { ServiceEventsController } from './service-events.controller';
import { ServiceEventsService } from './service-events.service';

/* No forFeature: service_events belongs to a client, so it goes through
   the tenant repositories rather than injecting its own. */
@Module({
  controllers: [ServiceEventsController],
  providers: [ServiceEventsService],
})
export class ServiceEventsModule {}
