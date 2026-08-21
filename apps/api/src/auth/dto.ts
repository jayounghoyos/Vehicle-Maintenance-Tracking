import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@citylogistics.co' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Registering creates the organization and the person who runs it, in
 *  one step. Every field organizations requires is asked for here. */
export class RegisterOrganizationDto {
  @ApiProperty({ example: 'City Logistics Fleet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  organizationName: string;

  @ApiProperty({ example: 'Ana Restrepo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  ownerName: string;

  @ApiProperty({ example: 'Cra 43A #1-50, Medellin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({ example: '3217240555' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @ApiProperty({ example: 'contacto@citylogistics.co' })
  @IsEmail()
  organizationEmail: string;

  @ApiProperty({ example: 'Ana Restrepo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'ana@citylogistics.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;
}
