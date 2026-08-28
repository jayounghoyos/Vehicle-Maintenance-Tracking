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
import { SaveRoleDto } from './dto';
import { RolesService, type RoleSummary } from './roles.service';

/**
 * The roles of the organization the token belongs to. No id in the path
 * that could name somebody else's, and no way to ask for them.
 *
 * Everyone reads the list, because every screen that shows a colleague
 * shows what they are. Only whoever staffs the fleet writes here: giving
 * yourself a permission is the same as not having permissions at all.
 */
@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @ApiOperation({ summary: 'Every role in the organization, and who holds it' })
  list(@CurrentUser() principal: Principal): Promise<RoleSummary[]> {
    return this.roles.list(this.asUser(principal).organizationId);
  }

  @Post()
  @Requires(Permission.MANAGE_TEAM)
  @ApiOperation({ summary: 'Invent a role' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: SaveRoleDto,
  ): Promise<RoleSummary> {
    return this.roles.create(this.asUser(principal).organizationId, dto);
  }

  @Patch(':id')
  @Requires(Permission.MANAGE_TEAM)
  @ApiOperation({ summary: 'Rename a role or change what it grants' })
  update(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveRoleDto,
  ): Promise<RoleSummary> {
    return this.roles.update(this.asUser(principal).organizationId, id, dto);
  }

  @Delete(':id')
  @Requires(Permission.MANAGE_TEAM)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a role nobody holds' })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.roles.remove(this.asUser(principal).organizationId, id);
  }
}
