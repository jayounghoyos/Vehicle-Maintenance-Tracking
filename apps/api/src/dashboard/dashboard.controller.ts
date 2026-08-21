import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard } from '../auth/guards';
import { DashboardService } from './dashboard.service';
import type { DashboardResponse } from './dashboard.types';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Everything the dashboard screen renders' })
  get(@CurrentUser() principal: Principal): Promise<DashboardResponse> {
    // admins run the service, they do not run a fleet, so there is no
    // dashboard for them to see
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no fleet dashboard');
    }
    return this.dashboard.build(principal.id, principal.organizationId);
  }
}
