import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { ServiceType } from '../entities';

export class ServiceLogQueryDto {
  @ApiPropertyOptional({ example: 12, description: 'Only this vehicle’s events' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;
}

export class RecordServiceEventDto {
  @ApiProperty({ example: 1, description: 'The vehicle being serviced' })
  @Type(() => Number)
  @IsInt()
  vehicleId: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'The maintenance schedule item this service fulfills, if any',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  scheduleId?: number | null;

  @ApiProperty({ example: 'Oil change', description: 'The task performed' })
  @IsString()
  @IsNotEmpty()
  taskName: string;

  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.PREVENTIVE,
    description:
      'Whether planned maintenance (preventive) or breakdown repair (corrective)',
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({
    example: '2026-09-02',
    description: 'Date the work was performed (YYYY-MM-DD)',
  })
  @IsDateString()
  performedAt: string;

  @ApiPropertyOptional({
    example: 129500,
    description: 'Vehicle odometer reading at time of service',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  odometerKm?: number | null;

  // required (issue #8): a log that does not say what was done or found
  // is the same gap the spreadsheets left
  @ApiProperty({
    example: 'Replaced oil filter and topped up fluid.',
    description: 'What was done and what was found. Required.',
  })
  @IsString()
  @Matches(/\S/, { message: 'notes must say what was done or found' })
  notes: string;

  @ApiPropertyOptional({
    example: 4,
    description:
      'The member who did the work. Give this or performedByName; with neither, the request is refused',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  performedById?: number | null;

  @ApiPropertyOptional({
    example: 'Taller El Poblado',
    description: 'An outside workshop with no account, used instead of performedById',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  performedByName?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Attached photographs as base64 data URIs or base64 strings',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
