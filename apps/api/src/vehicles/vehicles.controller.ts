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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { UserRole } from '../entities';
import { CreateVehicleDto, ImportVehiclesDto, UpdateVehicleDto } from './dto';
import { VehiclesService } from './vehicles.service';
import type { ImportResult, VehicleDetail, VehicleRow } from './vehicles.types';

/**
 * The same split the team screen uses: everybody in the organization can
 * see the fleet they work on, and the coordinator is the one who changes
 * it. The mechanic needs to know which van is in the shop; deciding
 * which vans exist is not their job.
 */
@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @ApiOperation({ summary: 'Every vehicle in the fleet' })
  list(@CurrentUser() principal: Principal): Promise<VehicleRow[]> {
    return this.vehicles.list(this.asUser(principal).organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One vehicle, with its schedules and recent services' })
  one(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VehicleDetail> {
    return this.vehicles.one(this.asUser(principal).organizationId, id);
  }

  @Post()
  @Roles(UserRole.FLEET_COORDINATOR)
  @ApiOperation({ summary: 'Register a vehicle' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateVehicleDto,
  ): Promise<VehicleRow> {
    return this.vehicles.create(this.asUser(principal).organizationId, dto);
  }

  @Post('bulk')
  @Roles(UserRole.FLEET_COORDINATOR)
  @ApiOperation({ summary: 'Register many vehicles from a pasted list' })
  importMany(
    @CurrentUser() principal: Principal,
    @Body() dto: ImportVehiclesDto,
  ): Promise<ImportResult> {
    return this.vehicles.importMany(this.asUser(principal).organizationId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.FLEET_COORDINATOR)
  @ApiOperation({ summary: 'Correct a vehicle' })
  update(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleRow> {
    return this.vehicles.update(this.asUser(principal).organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.FLEET_COORDINATOR)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a vehicle nothing is attached to yet' })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.vehicles.remove(this.asUser(principal).organizationId, id);
  }
}
