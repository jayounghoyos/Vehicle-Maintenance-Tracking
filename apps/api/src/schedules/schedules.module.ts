import { Module } from '@nestjs/common';

import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

/* No forFeature: everything schedules touches — vehicles, maintenance
   tasks, maintenance schedules, service events — belongs to a client,
   so it goes through the tenant repositories rather than injecting its
   own, same as service-events. */
@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
