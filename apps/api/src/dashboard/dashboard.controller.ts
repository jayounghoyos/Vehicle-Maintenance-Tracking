import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import type { DashboardResponse } from './dashboard.types';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Everything the dashboard screen renders' })
  get(): Promise<DashboardResponse> {
    return this.dashboard.build();
  }
}
