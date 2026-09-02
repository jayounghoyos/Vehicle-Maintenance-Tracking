import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { CreateWorkerDto, ImportTeamDto, UpdateMemberDto } from './dto';
import { TeamService, type ImportResult, type TeamMember } from './team.service';

/**
 * Everyone in the organization may see who their colleagues are, as long
 * as their role opens this screen at all. Staffing it is a permission of
 * its own, so the split is per method rather than per controller.
 */
@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @Requires(Permission.VIEW_TEAM)
  @ApiOperation({ summary: 'Everyone in the organization' })
  list(@CurrentUser() principal: Principal): Promise<TeamMember[]> {
    return this.team.list(this.asUser(principal).organizationId);
  }

  @Post()
  @Requires(Permission.MANAGE_TEAM)
  @ApiOperation({ summary: 'Create a worker account' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateWorkerDto,
  ): Promise<TeamMember> {
    return this.team.create(this.asUser(principal).organizationId, dto);
  }

  @Post('bulk')
  @Requires(Permission.MANAGE_TEAM)
  @ApiOperation({ summary: 'Create many accounts from a pasted list' })
  importMany(
    @CurrentUser() principal: Principal,
    @Body() dto: ImportTeamDto,
  ): Promise<ImportResult> {
    return this.team.importMany(this.asUser(principal).organizationId, dto);
  }

  @Patch(':id')
  @Requires(Permission.MANAGE_TEAM)
  @ApiOperation({ summary: 'Change a role, or retire an account and bring it back' })
  update(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
  ): Promise<TeamMember> {
    const user = this.asUser(principal);
    return this.team.update(user.organizationId, user.id, id, dto);
  }

  @Delete(':id')
  @Requires(Permission.MANAGE_TEAM)
  @HttpCode(204)
  @ApiOperation({ summary: 'Permanently remove an account with no history' })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const user = this.asUser(principal);
    return this.team.remove(user.organizationId, user.id, id);
  }
}
