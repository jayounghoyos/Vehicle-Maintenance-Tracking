import {
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { ReportsService } from './reports.service';
import type { ReportsResponse } from './reports.types';

const RANGES = [3, 6, 12];
const DEFAULT_MONTHS = 12;

/**
 * Behind a grant of its own. The charts name mechanics and read plates,
 * which are the same facts the team and vehicle screens ask a permission
 * for, so the summary of them cannot be the one page that asks nothing.
 */
@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @Requires(Permission.VIEW_REPORTS)
  @ApiQuery({ name: 'months', required: false, enum: RANGES })
  @ApiOperation({ summary: 'Every metric the reports screen can draw' })
  get(
    @CurrentUser() principal: Principal,
    @Query('months', new DefaultValuePipe(DEFAULT_MONTHS), ParseIntPipe) months: number,
  ): Promise<ReportsResponse> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no fleet reports');
    }
    // one of the offered ranges or the default, so a hand-typed number
    // cannot ask for a decade of empty months
    const range = RANGES.includes(months) ? months : DEFAULT_MONTHS;
    return this.reports.build(principal.organizationId, range);
  }
}
