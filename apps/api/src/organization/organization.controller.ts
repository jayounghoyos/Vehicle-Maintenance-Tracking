import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { UserRole } from '../entities';
import { UpdateOrganizationDto } from './dto';
import { OrganizationService, type OrganizationProfile } from './organization.service';

/**
 * Singular and with no id in the path: the organization you get is the
 * one your token belongs to, so there is no id to tamper with and no way
 * to ask for somebody else's.
 *
 * Everyone may read it. Only the coordinator may correct it, the same
 * split the team screen uses.
 */
@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @ApiOperation({ summary: 'The organization the caller belongs to' })
  get(@CurrentUser() principal: Principal): Promise<OrganizationProfile> {
    return this.organizations.get(this.asUser(principal).organizationId);
  }

  @Patch()
  @Roles(UserRole.FLEET_COORDINATOR)
  @ApiOperation({ summary: 'Correct the organization details' })
  update(
    @CurrentUser() principal: Principal,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationProfile> {
    return this.organizations.update(this.asUser(principal).organizationId, dto);
  }
}
