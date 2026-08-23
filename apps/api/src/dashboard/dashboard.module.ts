import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/* No forFeature: every table this reads belongs to a client, so it goes
   through the tenant repositories rather than injecting its own. */
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
