import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDate,
  IsPhoneNumber,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Normalización de Strings:
 * - Trim de espacios al inicio/final.
 * - Colapsar múltiples espacios internos a uno solo.
 */
function NormalizeString({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Normalización de Cédula:
 * - Solo caracteres alfanuméricos.
 */
function NormalizeCedula({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[^a-zA-Z0-9]/g, '');
}

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  @Transform(NormalizeString)
  province!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(NormalizeString)
  canton!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(NormalizeString)
  district!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(NormalizeString)
  town!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  exactAddress!: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  postalCode?: string;
}

export class RegisterCustomerDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña es demasiado débil (debe incluir mayúscula, minúscula y número/símbolo)',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmPassword!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(NormalizeCedula)
  cedula!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(NormalizeString)
  fullName!: string;

  @Type(() => Date)
  @IsDate()
  birthDate!: Date;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[2|4|6|8]\d{7}$/, {
    message: 'El número de teléfono no es válido para Costa Rica',
  })
  phone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}

export class CreateCustomerByAdminDto extends RegisterCustomerDto {}

export class UpdateMyProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  @Transform(NormalizeString)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[2|4|6|8]\d{7}$/, {
    message: 'El número de teléfono no es válido para Costa Rica',
  })
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class UpdateCustomerByAdminDto extends UpdateMyProfileDto {
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(NormalizeCedula)
  cedula?: string;
}
