import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import { Permission } from '../entities';

/**
 * The same shape creates a role and edits one. A role is only a name and
 * a set of grants, so a partial edit would save nothing and would make
 * "remove every permission" impossible to express.
 */
export class SaveRoleDto {
  @ApiProperty({ example: 'Warehouse supervisor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ enum: Permission, isArray: true, example: [Permission.VIEW_VEHICLES] })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
