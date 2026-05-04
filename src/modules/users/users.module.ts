import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Address } from './entities/address.entity';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UserRepository } from './repositories/user.repository.js';
import { UserProfileRepository } from './repositories/user-profile.repository.js';
import { AddressRepository } from './repositories/address.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Address]),
    SessionsModule,
  ],
  providers: [
    UsersService,
    UserRepository,
    UserProfileRepository,
    AddressRepository,
  ],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
