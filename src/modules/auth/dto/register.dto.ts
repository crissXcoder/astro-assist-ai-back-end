import { IsEmail, IsString, MinLength, IsDateString, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  cedula: string;

  @IsString()
  fullName: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  phone: string;

  @IsString()
  province: string;

  @IsString()
  canton: string;

  @IsString()
  district: string;

  @IsString()
  city: string;

  @IsString()
  exactAddress: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}
