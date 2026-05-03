import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Session } from './entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { 
      email, password, cedula, fullName, birthDate, phone,
      province, canton, district, city, exactAddress, postalCode 
    } = registerDto;

    const user = await this.usersService.registerCustomer({
      email,
      password,
      confirmPassword: password, // In this legacy endpoint we assume they match
      cedula,
      fullName,
      birthDate: new Date(birthDate),
      phone,
      address: {
        province,
        canton,
        district,
        town: city,
        exactAddress,
        postalCode,
      },
    });

    return {
      message: 'User registered successfully',
      user: { id: user.id, email: user.email },
    };
  }

  async login(loginDto: LoginDto, userAgent?: string, ip?: string) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = this.sessionRepository.create({
      user,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent,
      ipAddress: ip ?? undefined,
    });

    await this.sessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async logout(userId: string) {
    await this.sessionRepository.update(
      { user: { id: userId } },
      { revokedAt: new Date() },
    );
    return { message: 'Logged out successfully' };
  }
}
