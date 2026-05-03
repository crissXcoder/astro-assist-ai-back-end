import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../users/enums/role.enum.js';

export class UpdateUserByAdminDto {
  @IsEmail({}, { message: 'Email inválido.' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsOptional()
  password?: string;

  @IsEnum(Role, { message: 'Rol inválido.' })
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
