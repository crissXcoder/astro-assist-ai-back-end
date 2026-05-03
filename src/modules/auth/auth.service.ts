import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { Session } from './entities/session.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ErrorCode } from '../../common/constants/error-codes.js';

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

    // registerCustomer ya valida unicidad de email/cédula
    const user = await this.usersService.registerCustomer({
      email,
      password,
      confirmPassword: password,
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

    return user;
  }

  async login(loginDto: LoginDto, userAgent?: string, ip?: string) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    // Error genérico para no revelar existencia de email
    const invalidCredentialsError = new UnauthorizedException({
      errorCode: ErrorCode.AUTH_INVALID_CREDENTIALS,
      userMessage: 'Credenciales inválidas. Verifica tu email y contraseña.',
    });

    if (!user || !user.isActive) {
      throw invalidCredentialsError;
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw invalidCredentialsError;
    }

    // Crear sesión inicial
    const session = this.sessionRepository.create({
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      userAgent,
      ipAddress: ip,
      lastUsedAt: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    const tokens = await this.generateTokens(user, savedSession.id);

    // Hashear refresh token antes de guardar
    savedSession.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.sessionRepository.save(savedSession);

    return { ...tokens, user };
  }

  async refresh(userId: string, refreshToken: string, userAgent?: string, ip?: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_SESSION_EXPIRED,
        userMessage: 'Sesión expirada. Inicia sesión de nuevo.',
      });
    }

    // Buscar sesiones activas del usuario
    const sessions = await this.sessionRepository.find({
      where: { userId: user.id, revokedAt: IsNull() },
    });

    // Validar el hash del token contra las sesiones
    let currentSession: Session | undefined;
    for (const s of sessions) {
      const isValid = await bcrypt.compare(refreshToken, s.refreshTokenHash);
      if (isValid) {
        currentSession = s;
        break;
      }
    }

    if (!currentSession || currentSession.expiresAt < new Date()) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
        userMessage: 'Token de sesión inválido o expirado.',
      });
    }

    // Rotación: generar nuevos tokens
    const tokens = await this.generateTokens(user, currentSession.id);

    // Actualizar sesión con nuevo hash y metadatos
    currentSession.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    currentSession.lastUsedAt = new Date();
    currentSession.userAgent = userAgent || currentSession.userAgent;
    currentSession.ipAddress = ip || currentSession.ipAddress;
    
    await this.sessionRepository.save(currentSession);

    return tokens;
  }

  async logout(sessionId: string) {
    await this.sessionRepository.update(
      { id: sessionId },
      { revokedAt: new Date() },
    );
  }

  async getActiveSessions(userId: string) {
    return this.sessionRepository.find({
      where: { userId, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionRepository.findOneBy({ id: sessionId, userId });
    if (!session) {
      throw new UnauthorizedException('Sesión no encontrada.');
    }
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND id != :currentSessionId AND revokedAt IS NULL', {
        userId,
        currentSessionId,
      })
      .execute();
  }

  private async generateTokens(user: any, sessionId: string) {
    const accessToken = this.jwtService.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        sid: sessionId 
      },
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

    return { accessToken, refreshToken };
  }
}
