import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { databaseOptions } from './database';
import { OrganizationModule } from './organization/organization.module';
import { PhotosModule } from './photos/photos.module';
import { RolesModule } from './roles/roles.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ServiceEventsModule } from './service-events/service-events.module';
import { TeamModule } from './team/team.module';
import { TenantModule } from './tenant/tenant.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // the repo root .env is the one docker compose also reads
      envFilePath: ['.env', '../../.env'],
    }),
    // the same options the migration CLI uses, so the application and
    // the migrations can never disagree about which database this is
    TypeOrmModule.forRootAsync({ useFactory: () => databaseOptions() }),
    TenantModule,
    PhotosModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    VehiclesModule,
    ServiceEventsModule,
    SchedulesModule,
    TeamModule,
    RolesModule,
    OrganizationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
