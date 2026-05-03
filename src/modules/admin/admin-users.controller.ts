import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  ParseUUIDPipe,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../users/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto.js';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { plainToInstance } from 'class-transformer';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const [users, total] = await this.usersService.findAllPaginated(page, limit);
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

  @Post()
  async create(@Body() createUserDto: CreateUserByAdminDto) {
    const user = await this.usersService.createByAdmin(createUserDto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserByAdminDto,
  ) {
    const user = await this.usersService.updateByAdmin(id, updateUserDto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const user = await this.usersService.updateStatus(id, isActive);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
