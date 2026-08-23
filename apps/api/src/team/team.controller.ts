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

/**
 * Everyone in the organization may see who their colleagues are. Only the
 * coordinator staffs the fleet, so only the coordinator writes here.
 *
 * The split is per method rather than per controller on purpose: hiding
 * the list from a mechanic would say the roles differ in what they know,
 * when what they really differ in is what they may change.
 */
@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.FLEET_COORDINATOR)
  @ApiOperation({ summary: 'Create a worker account' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateWorkerDto,
  ): Promise<TeamMember> {
    return this.team.create(this.asUser(principal).organizationId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.FLEET_COORDINATOR)
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
