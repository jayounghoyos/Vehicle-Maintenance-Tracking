import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetFlagDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  value: boolean;
}
