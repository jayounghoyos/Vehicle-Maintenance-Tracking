import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolePermission } from '../entities';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

/** Exported because staffing the fleet needs to know whether a role id
 *  is real and whether the last person who can staff it is leaving. */
@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
