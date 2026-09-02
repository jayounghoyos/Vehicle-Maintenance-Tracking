import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { LogServiceEventDto, ServiceLogQueryDto } from './dto';
import { ServiceEventsService } from './service-events.service';
import type { ServiceLogRow } from './service-events.types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

@ApiTags('service-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('service-events')
export class ServiceEventsController {
  constructor(private readonly serviceEvents: ServiceEventsService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') {
      throw new ForbiddenException('Admins have no fleet service log');
    }
    return principal;
  }

  @Get('tasks')
  @Requires(Permission.VIEW_SERVICE_LOG)
  @ApiOperation({ summary: 'List maintenance tasks defined for this organization' })
  getTasks(@CurrentUser() principal: Principal): Promise<{ id: number; name: string }[]> {
    return this.serviceEvents.getTasks(this.asUser(principal).organizationId);
  }

  @Get()
  @Requires(Permission.VIEW_SERVICE_LOG)
  @ApiOperation({ summary: 'The organization’s service events, most recent first' })
  list(
    @CurrentUser() principal: Principal,
    @Query() query: ServiceLogQueryDto,
  ): Promise<ServiceLogRow[]> {
    return this.serviceEvents.list(this.asUser(principal).organizationId, query.vehicleId);
  }

  @Post()
  @Requires(Permission.LOG_SERVICE)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Record work done on a vehicle with optional photo receipt' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: LogServiceEventDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<ServiceLogRow> {
    const user = this.asUser(principal);
    return this.serviceEvents.create(user.organizationId, user.id, dto, photo?.buffer);
  }
}

