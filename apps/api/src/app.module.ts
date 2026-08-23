import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { entities } from './entities';
import { OrganizationModule } from './organization/organization.module';
import { TeamModule } from './team/team.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // the repo root .env is the one docker compose also reads
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'mts'),
        password: config.get<string>('DB_PASSWORD', 'mts'),
        database: config.get<string>('DB_NAME', 'mts'),
        entities,
        // never true: the schema is owned by migrations, so a stray
        // entity edit can't quietly rewrite the database
        synchronize: false,
      }),
    }),
    HealthModule,
    AuthModule,
    DashboardModule,
    TeamModule,
    OrganizationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
