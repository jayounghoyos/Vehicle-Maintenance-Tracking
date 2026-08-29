import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Every field is optional so a partial edit is a legal request, but none
 * of them may be blanked: the registry identity is what the platform
 * admin calls when something goes wrong with the account.
 *
 * is_active and deleted_at are deliberately absent. An organization does
 * not get to lift its own suspension.
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'City Logistics Fleet' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Ana Restrepo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  ownerName?: string;

  @ApiPropertyOptional({ example: 'Cra 43A #1-50, El Poblado, Medellin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: '3217240555' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'logistics@citylogistics.co' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  /**
   * The one exception to "nothing may be blanked": null is a real answer
   * here and means going back to the colour in the brand manual.
   */
  @ApiPropertyOptional({ example: '#CFF255', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsHexColor()
  @MaxLength(7)
  accentColor?: string | null;
}
