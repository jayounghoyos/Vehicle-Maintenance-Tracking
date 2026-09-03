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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import {
  CreateMaintenanceTaskDto,
  CreateScheduleDto,
  ScheduleQueryDto,
  UpdateScheduleDto,
} from './dto';
import { SchedulesService } from './schedules.service';
import type { ScheduleRow, TaskItem } from './schedules.types';

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  @Requires(Permission.VIEW_VEHICLES)
  @ApiOperation({
    summary: 'The organization’s maintenance plan, optionally for one vehicle',
  })
  list(
    @CurrentUser() principal: Principal,
    @Query() query: ScheduleQueryDto,
  ): Promise<ScheduleRow[]> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no fleet maintenance plan');
    }
    return this.schedules.list(principal.organizationId, query.vehicleId);
  }

  @Get('tasks')
  @Requires(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Catalog of maintenance tasks for the organization' })
  tasks(@CurrentUser() principal: Principal): Promise<TaskItem[]> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no task catalog');
    }
    return this.schedules.listTasks(principal.organizationId);
  }

  @Post('tasks')
  @Requires(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Add a task to the organization’s catalog' })
  createTask(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateMaintenanceTaskDto,
  ): Promise<TaskItem> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no task catalog');
    }
    return this.schedules.createTask(principal.organizationId, dto.name);
  }

  @Post()
  @Requires(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Add a maintenance plan item to a vehicle' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleRow> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins cannot manage fleet maintenance plans');
    }
    return this.schedules.create(principal.organizationId, dto);
  }

  @Patch(':id')
  @Requires(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Correct a maintenance plan item' })
  update(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleRow> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins cannot manage fleet maintenance plans');
    }
    return this.schedules.update(principal.organizationId, id, dto);
  }

  @Delete(':id')
  @Requires(Permission.MANAGE_SCHEDULES)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove a maintenance plan item nothing has been logged against',
  })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins cannot manage fleet maintenance plans');
    }
    return this.schedules.remove(principal.organizationId, id);
  }
}
