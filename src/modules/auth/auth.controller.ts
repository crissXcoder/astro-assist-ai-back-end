import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(registerDto);
    
    // Login automático tras registro
    const loginResult = await this.authService.login(
      { email: registerDto.email, password: registerDto.password },
      req.headers['user-agent'],
      req.ip,
    );

    this.setCookies(res, loginResult.accessToken, loginResult.refreshToken);

    return {
      message: 'Usuario registrado e identificado con éxito',
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto,
      req.headers['user-agent'],
      req.ip,
    );

    this.setCookies(res, accessToken, refreshToken);

    return {
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // JwtRefreshGuard inyecta { id: userId, refreshToken }
    const tokens = await this.authService.refresh(
      user.id,
      user.refreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    this.setCookies(res, tokens.accessToken, tokens.refreshToken);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sessionId);
    this.clearCookies(res);
    return { message: 'Sesión cerrada correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    const sessions = await this.authService.getActiveSessions(user.id);
    return sessions.map(s => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      isCurrent: s.id === user.sessionId,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    await this.authService.revokeSession(user.id, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeOthers(
    @CurrentUser() user: any,
  ) {
    await this.authService.revokeOtherSessions(user.id, user.sessionId);
  }

  private setCookies(res: Response, access: string, refresh: string) {
    const isProd = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', access, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax', // Permite navegación inicial con cookies
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie('refresh_token', refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh', // Solo se envía al endpoint de refresh
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }
}
