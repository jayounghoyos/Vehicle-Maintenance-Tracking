import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ServiceType } from '../entities';

export class ServiceLogQueryDto {
  @ApiPropertyOptional({ example: 12, description: 'Only this vehicle’s events' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;
}

export class LogServiceEventDto {
  @ApiProperty({ example: '2026-03-01', description: 'Date the service was performed (YYYY-MM-DD)' })
  @IsDateString()
  performedAt: string;

  @ApiProperty({ example: 1, description: 'ID of the vehicle' })
  @Type(() => Number)
  @IsInt()
  vehicleId: number;

  @ApiProperty({ example: 2, description: 'ID of the maintenance task' })
  @Type(() => Number)
  @IsInt()
  taskId: number;

  @ApiProperty({ enum: ServiceType, example: ServiceType.PREVENTIVE, description: 'Service type' })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiPropertyOptional({ example: 45000, description: 'Odometer reading in kilometers at time of service' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  odometerKm?: number;

  @ApiPropertyOptional({ example: 'Replaced oil filter and topped up synthetic 5W-30', description: 'Additional workshop notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 3, description: 'ID of the team member who performed or recorded the service' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  recordedBy?: number;
}

