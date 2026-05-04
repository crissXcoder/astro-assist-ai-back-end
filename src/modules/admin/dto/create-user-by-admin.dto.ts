import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsDate,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AddressDto } from '../../users/dto/user.dto.js';

/**
 * Normalización de Strings (reutilizada del módulo users).
 */
function NormalizeString({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}

function NormalizeCedula({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * DTO para creación de cliente por administrador.
 * Sin campo `role`: siempre se crea como CUSTOMER.
 * Mismos datos que el registro público.
 */
export class CreateUserByAdminDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña es demasiado débil (debe incluir mayúscula, minúscula y número/símbolo).',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida.' })
  confirmPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'La cédula es requerida.' })
  @Transform(NormalizeCedula)
  cedula!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido.' })
  @MaxLength(150)
  @Transform(NormalizeString)
  fullName!: string;

  @Type(() => Date)
  @IsDate({ message: 'La fecha de nacimiento no es válida.' })
  birthDate!: Date;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido.' })
  @Matches(/^[2|4|6|8]\d{7}$/, {
    message: 'El número de teléfono no es válido para Costa Rica.',
  })
  phone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
