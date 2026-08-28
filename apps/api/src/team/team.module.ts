import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceEvent, User } from '../entities';
import { RolesModule } from '../roles/roles.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ServiceEvent]), RolesModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
