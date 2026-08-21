import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminGuard, JwtAuthGuard } from '../auth/guards';
import { AdminService, type AdminOrganization } from './admin.service';
import { SetFlagDto } from './dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('organizations')
  @ApiOperation({ summary: 'Every organization, deleted ones included' })
  list(): Promise<AdminOrganization[]> {
    return this.admin.list();
  }

  @Get('stats')
  @ApiOperation({ summary: 'How many organizations, and in what state' })
  stats(): Promise<{ total: number; active: number; deleted: number }> {
    return this.admin.stats();
  }

  @Patch('organizations/:id/active')
  @ApiOperation({ summary: 'Suspend or reinstate an organization' })
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetFlagDto,
  ): Promise<AdminOrganization> {
    return this.admin.setActive(id, dto.value);
  }

  @Patch('organizations/:id/deleted')
  @ApiOperation({ summary: 'Soft delete an organization, or bring it back' })
  setDeleted(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetFlagDto,
  ): Promise<AdminOrganization> {
    return this.admin.setDeleted(id, dto.value);
  }
}
