import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  MaintenanceSchedule,
  Organization,
  ServiceEvent,
  User,
  Vehicle,
} from '../entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Vehicle,
      MaintenanceSchedule,
      ServiceEvent,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
