import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

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

  @ApiProperty({ description: 'One of the roles of your own organization' })
  @IsInt()
  @IsPositive()
  roleId: number;
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

  @ApiProperty({ description: 'One of the roles of your own organization' })
  @IsInt()
  @IsPositive()
  roleId: number;

  /** Absent means the API picks one and hands it back to be passed on. */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password?: string;
}

/**
 * The browser resolves what was pasted against the organization's own
 * roles, so the API can stay strict: "Operations Manager" becomes a role
 * id before it is sent, and anything this rejects is a row the preview
 * should already have flagged.
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

/**
 * A partial change to an account: what it is called, how it signs in,
 * what it may do, and whether it still works here. Everything is
 * optional and any of it may arrive together.
 */
export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Carlos Mejia' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'carlos@citylogistics.co' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  /** absent leaves the current one alone; nobody can read it back */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password?: string;

  @ApiPropertyOptional({ description: 'One of the roles of your own organization' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  roleId?: number;

  /** false retires the account, true brings it back */
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
