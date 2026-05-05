import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateMyProfileDto } from './dto/user.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Públicos ────────────────────────────────────────

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.usersService.registerCustomer(dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  // ── Perfil Propio ────────────────────────────────────

  @Get('me')
  async getMyProfile(
    @CurrentUser('id') userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateMyProfile(userId, dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
