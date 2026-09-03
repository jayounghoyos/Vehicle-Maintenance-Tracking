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
import { CurrentUser, JwtAuthGuard } from '../auth/guards';
import { ReportsService } from './reports.service';
import type { ReportsResponse } from './reports.types';

const RANGES = [3, 6, 12];
const DEFAULT_MONTHS = 12;

/**
 * No PermissionsGuard, like the dashboard: roles here differ in what
 * they may change, not in what they may know.
 */
@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
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
