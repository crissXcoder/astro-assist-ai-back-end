import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Normalización de Strings.
 */
function NormalizeString({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * DTO para actualización de cliente por administrador.
 * Sin campo `role`: no se puede cambiar el rol desde UI.
 * Edición básica: nombre, email, teléfono, contraseña, estado.
 */
export class UpdateUserByAdminDto {
  @IsEmail({}, { message: 'Email inválido.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  @Transform(NormalizeString)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[2|4|6|8]\d{7}$/, {
    message: 'El número de teléfono no es válido para Costa Rica.',
  })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
