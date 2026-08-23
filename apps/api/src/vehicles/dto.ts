import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { VehicleStatus } from '../entities';

/* Read once when the module loads. A fleet buying next year's model is
 * ordinary; a fleet buying one from 2124 is a typo. */
const NEWEST_YEAR = new Date().getFullYear() + 1;
const OLDEST_YEAR = 1950;

/** Somebody is going to hit six digits, nobody is going to hit eight. */
const MAX_ODOMETER = 9_999_999;

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plate: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  make: string;

  @ApiProperty({ example: 'NHR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  model: string;

  @ApiPropertyOptional({ example: 2019, minimum: OLDEST_YEAR, maximum: NEWEST_YEAR })
  @IsOptional()
  @IsInt()
  @Min(OLDEST_YEAR)
  @Max(NEWEST_YEAR)
  year?: number;

  @ApiPropertyOptional({ example: 128450, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_ODOMETER)
  odometerKm?: number;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

/**
 * Everything optional, nothing blankable. A vehicle keeps its plate, its
 * model and its odometer unless the caller says otherwise.
 */
export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plate?: string;

  @ApiPropertyOptional({ example: 'Chevrolet' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  make?: string;

  @ApiPropertyOptional({ example: 'NHR' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  model?: string;

  @ApiPropertyOptional({ example: 2019 })
  @IsOptional()
  @IsInt()
  @Min(OLDEST_YEAR)
  @Max(NEWEST_YEAR)
  year?: number;

  @ApiPropertyOptional({ example: 131000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_ODOMETER)
  odometerKm?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class ImportVehicleDto extends CreateVehicleDto {}

/**
 * The browser normalises the paste before sending, so the API stays
 * strict: anything rejected here is a row the preview should already
 * have flagged.
 *
 * 200 a paste, for the same reason the team import has one: a single
 * insert and a single response, rather than a request that sits there.
 */
export class ImportVehiclesDto {
  @ApiProperty({ type: [ImportVehicleDto], maxItems: 200 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ImportVehicleDto)
  vehicles: ImportVehicleDto[];
}
