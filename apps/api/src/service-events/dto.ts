import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ServiceLogQueryDto {
  @ApiPropertyOptional({ example: 12, description: 'Only this vehicle’s events' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;
}
