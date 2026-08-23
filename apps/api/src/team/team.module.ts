import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceEvent, User } from '../entities';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ServiceEvent])],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
