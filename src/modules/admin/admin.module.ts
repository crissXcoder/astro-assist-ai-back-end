import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    UsersModule,
    AuthModule,
  ],
  controllers: [AdminUsersController],
})
export class AdminModule {}
