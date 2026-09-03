import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * "At least one interval is set" per the entity. `IsOptional` skips
 * every validator on the property it decorates once that property is
 * null, so this rule cannot live on intervalDays or intervalKm
 * themselves — a payload with both null would then have it skipped on
 * both sides. It lives on a property of its own instead, one the
 * request never sets, so nothing gates it.
 */
@ValidatorConstraint({ name: 'atLeastOneInterval', async: false })
class AtLeastOneIntervalConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as {
      intervalDays?: number | null;
      intervalKm?: number | null;
    };
    return dto.intervalDays != null || dto.intervalKm != null;
  }
  defaultMessage(): string {
    return 'At least one of intervalDays or intervalKm is required';
  }
}

export class ScheduleQueryDto {
  @ApiPropertyOptional({ example: 12, description: 'Only this vehicle’s schedules' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;
}

export class CreateScheduleDto {
  @ApiProperty({ example: 1, description: 'The vehicle this schedule applies to' })
  @Type(() => Number)
  @IsInt()
  vehicleId: number;

  @ApiProperty({ example: 2, description: 'The maintenance task this schedule repeats' })
  @Type(() => Number)
  @IsInt()
  taskId: number;

  @ApiPropertyOptional({ example: 180, description: 'Repeats every N days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @ApiPropertyOptional({ example: 10000, description: 'Repeats every N kilometres' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalKm?: number | null;

  @Validate(AtLeastOneIntervalConstraint)
  private readonly _intervalCheck?: unknown;
}

/**
 * Everything optional: a patch can move the task, tighten an interval,
 * or clear one to null. What it cannot do is leave the row with both
 * null — but that is checked against the row it is patching, in the
 * service, not here. The DTO alone cannot tell "left alone" from
 * "cleared" for a field the caller did not send.
 */
export class UpdateScheduleDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  taskId?: number;

  @ApiPropertyOptional({ example: 180, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @ApiPropertyOptional({ example: 10000, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  intervalKm?: number | null;
}

export class CreateMaintenanceTaskDto {
  @ApiProperty({ example: 'Oil change' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
