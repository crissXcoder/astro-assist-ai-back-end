import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

/**
 * DTO para inicio de sesión.
 * Copia local para el Backend.
 */
export class LoginDto {
  @IsEmail(undefined, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}
