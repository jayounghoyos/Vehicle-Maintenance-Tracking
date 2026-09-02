import { Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { ServiceLogQueryDto } from './dto';
import { ServiceEventsService } from './service-events.service';
import type { ServiceLogRow } from './service-events.types';

@ApiTags('service-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('service-events')
export class ServiceEventsController {
  constructor(private readonly serviceEvents: ServiceEventsService) {}

  @Get()
  @Requires(Permission.VIEW_SERVICE_LOG)
  @ApiOperation({ summary: 'The organization’s service events, most recent first' })
  list(
    @CurrentUser() principal: Principal,
    @Query() query: ServiceLogQueryDto,
  ): Promise<ServiceLogRow[]> {
    // admins run the service, they do not run a fleet, so there is
    // nothing here for them to see
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no fleet service log');
    }
    return this.serviceEvents.list(principal.organizationId, query.vehicleId);
  }
}
