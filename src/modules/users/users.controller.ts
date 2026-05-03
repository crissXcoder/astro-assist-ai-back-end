import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Query, 
  ParseUUIDPipe, 
  DefaultValuePipe, 
  ParseIntPipe 
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { 
  RegisterCustomerDto, 
  CreateCustomerByAdminDto, 
  UpdateMyProfileDto 
} from './dto/user.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Públicos ────────────────────────────────────────

  @Post('register')
  async register(@Body() dto: RegisterCustomerDto): Promise<UserResponseDto> {
    const user = await this.usersService.registerCustomer(dto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  // ── Perfil Propio ────────────────────────────────────

  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateMyProfile(userId, dto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  // ── Administración (Protección vía Guards en AuthModule) ──

  @Post()
  async createByAdmin(@Body() dto: CreateCustomerByAdminDto): Promise<UserResponseDto> {
    const user = await this.usersService.createCustomerByAdmin(dto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ data: UserResponseDto[]; meta: any }> {
    const [users, total] = await this.usersService.findAllCustomers(page, limit);
    
    return {
      data: plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
