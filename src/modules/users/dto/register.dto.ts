import {
  IsEmail,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO para el registro de cliente (Costa Rica focus)
 * Copia local para el Backend (Users).
 */
export class RegisterDto {
  @IsEmail(undefined, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Matches(/^[0-9-]+$/, { message: 'Formato de cédula inválido' })
  cedula!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName!: string;

  @IsDateString(undefined, { message: 'Fecha de nacimiento inválida' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  birthDate!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'La provincia es obligatoria' })
  province!: string;

  @IsString()
  @IsNotEmpty({ message: 'El cantón es obligatorio' })
  canton!: string;

  @IsString()
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: 'La localidad/ciudad es obligatoria' })
  town!: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección exacta es obligatoria' })
  exactAddress!: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirmar la contraseña es obligatorio' })
  confirmPassword!: string;
}
