import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { Session } from './entities/session.entity.js';
import { RegisterDto } from '@shared/dto/register.dto';
import { LoginDto } from '@shared/dto/login.dto';
import { User } from '../users/entities/user.entity.js';
import {
  SecurityEventsService,
  SecurityEventType,
} from '../sessions/security-events.service.js';
import { SessionRepository } from './repositories/session.repository.js';
import { ErrorCode } from '../../common/constants/error-codes.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionRepository: SessionRepository,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  async register(registerDto: RegisterDto) {
    return this.usersService.registerCustomer(registerDto);
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

  async refresh(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_SESSION_EXPIRED,
        userMessage: 'Sesión expirada. Inicia sesión de nuevo.',
      });
    }

    // Buscar sesiones activas del usuario
    const sessions = await this.sessionRepository.findActiveByUserId(user.id);

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
    currentSession.refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      10,
    );
    currentSession.lastUsedAt = new Date();
    currentSession.userAgent = userAgent || currentSession.userAgent;
    currentSession.ipAddress = ip || currentSession.ipAddress;

    await this.sessionRepository.save(currentSession);

    return tokens;
  }

  async logout(sessionId: string, userId: string) {
    await this.sessionRepository.revokeSession(sessionId);

    this.securityEventsService.emit(userId, SecurityEventType.SESSION_REVOKED, {
      sessionId,
    });
  }

  async getActiveSessions(userId: string) {
    return this.sessionRepository.findActiveByUserId(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );
    if (!session) {
      throw new UnauthorizedException('Sesión no encontrada.');
    }
    await this.sessionRepository.revokeSession(sessionId);

    this.securityEventsService.emit(userId, SecurityEventType.SESSION_REVOKED, {
      sessionId,
    });
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.sessionRepository.revokeAllOtherSessions(
      userId,
      currentSessionId,
    );

    this.securityEventsService.emit(
      userId,
      SecurityEventType.SESSIONS_UPDATED,
      {
        action: 'REVOKED_OTHERS',
      },
    );
  }

  private async generateTokens(user: User, sessionId: string) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sid: sessionId,
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
