import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../users/enums/role.enum.js';

export class CreateUserByAdminDto {
  @IsEmail({}, { message: 'Email inválido.' })
  @IsNotEmpty({ message: 'El email es requerido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @IsEnum(Role, { message: 'Rol inválido.' })
  @IsNotEmpty({ message: 'El rol es requerido.' })
  role: Role;

  @IsString()
  @IsNotEmpty({ message: 'La cédula es requerida.' })
  cedula: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido.' })
  fullName: string;
}
