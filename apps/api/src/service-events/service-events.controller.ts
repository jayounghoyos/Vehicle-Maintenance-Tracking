import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { RecordServiceEventDto, ServiceLogQueryDto } from './dto';
import { ServiceEventsService } from './service-events.service';
import type { ServiceLogRow, TaskItem } from './service-events.types';

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

  @Get('tasks')
  @Requires(Permission.LOG_SERVICE)
  @ApiOperation({ summary: 'Catalog of maintenance tasks for the organization' })
  tasks(@CurrentUser() principal: Principal): Promise<TaskItem[]> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no task catalog');
    }
    return this.serviceEvents.getTasks(principal.organizationId);
  }

  @Post()
  @Requires(Permission.LOG_SERVICE)
  @ApiOperation({ summary: 'Record a maintenance service or breakdown event' })
  record(
    @CurrentUser() principal: Principal,
    @Body() dto: RecordServiceEventDto,
  ): Promise<ServiceLogRow> {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins cannot record fleet services');
    }
    return this.serviceEvents.recordService(principal.organizationId, principal.id, dto);
  }

  @Get('photos/:storageKey')
  @Requires(Permission.VIEW_SERVICE_LOG)
  @ApiOperation({ summary: 'Retrieve an attached service photo' })
  async getPhoto(
    @CurrentUser() principal: Principal,
    @Param('storageKey') storageKey: string,
    @Res() res: Response,
  ) {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins cannot access fleet service photos');
    }
    const { filePath, contentType } = await this.serviceEvents.getPhotoFilePath(
      principal.organizationId,
      storageKey,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }
}
