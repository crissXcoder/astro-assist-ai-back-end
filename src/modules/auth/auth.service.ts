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
      email,
      password,
      cedula,
      fullName,
      birthDate,
      phone,
      ...addressData
    } = registerDto;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.usersService.create(
      { email, passwordHash },
      { cedula, fullName, birthDate: new Date(birthDate), phone },
    );

    // Normally we would also save the address here by extending UsersService.create
    // or injecting AddressRepository here, but for now we keep it simple or update UsersService later.

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
      ipHash: ip ? await bcrypt.hash(ip, 10) : undefined,
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
      { isRevoked: true },
    );
    return { message: 'Logged out successfully' };
  }
}
