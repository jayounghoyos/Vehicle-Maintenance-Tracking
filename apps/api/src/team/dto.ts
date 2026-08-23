import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { UserRole } from '../entities';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Carlos Mejia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'carlos@citylogistics.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MECHANIC })
  @IsEnum(UserRole)
  role: UserRole;
}

export class ImportMemberDto {
  @ApiProperty({ example: 'Carlos Mejia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'carlos@citylogistics.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MECHANIC })
  @IsEnum(UserRole)
  role: UserRole;

  /** Absent means the API picks one and hands it back to be passed on. */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password?: string;
}

/**
 * The browser normalises what was pasted, so the API can stay strict:
 * "Operations Manager" becomes operations_manager before it is sent, and
 * anything this rejects is a row the preview should already have flagged.
 *
 * 200 is a hashing limit, not a spreadsheet one. Argon2 is deliberately
 * slow, so a request holding thousands of rows would sit there for
 * minutes. Bigger imports go in more than one paste.
 */
export class ImportTeamDto {
  @ApiProperty({ type: [ImportMemberDto], maxItems: 200 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ImportMemberDto)
  members: ImportMemberDto[];
}
