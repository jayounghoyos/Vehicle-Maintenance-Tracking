import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { UserRole } from '../entities';
import { CreateWorkerDto } from './dto';
import { TeamService, type TeamMember } from './team.service';

/** The coordinator runs the fleet, so the coordinator staffs it. */
@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FLEET_COORDINATOR)
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @ApiOperation({ summary: 'Everyone in the organization' })
  list(@CurrentUser() principal: Principal): Promise<TeamMember[]> {
    return this.team.list(this.asUser(principal).organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a worker account' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateWorkerDto,
  ): Promise<TeamMember> {
    return this.team.create(this.asUser(principal).organizationId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a worker account' })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const user = this.asUser(principal);
    return this.team.remove(user.organizationId, user.id, id);
  }
}
