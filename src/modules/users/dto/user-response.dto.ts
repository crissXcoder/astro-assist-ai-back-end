import { Expose, Type } from 'class-transformer';
import { Role } from '../enums/role.enum.js';

export class AddressResponseDto {
  @Expose() id!: string;
  @Expose() province!: string;
  @Expose() canton!: string;
  @Expose() district!: string;
  @Expose() town!: string;
  @Expose() exactAddress!: string;
  @Expose() postalCode?: string;
  @Expose() country!: string;
  @Expose() isDefault!: boolean;
}

export class ProfileResponseDto {
  @Expose() cedula!: string;
  @Expose() fullName!: string;
  @Expose() birthDate!: Date;
  @Expose() phone!: string;
}

export class UserResponseDto {
  @Expose() id!: string;
  @Expose() email!: string;
  @Expose() role!: Role;
  @Expose() isActive!: boolean;
  @Expose() emailVerified!: boolean;
  @Expose() lastLoginAt!: Date | null;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Expose()
  @Type(() => ProfileResponseDto)
  profile!: ProfileResponseDto;

  @Expose()
  @Type(() => AddressResponseDto)
  addresses!: AddressResponseDto[];
}
