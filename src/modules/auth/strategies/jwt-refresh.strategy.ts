import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtRefreshPayload } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          return (request?.cookies?.refresh_token as string) || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') || 'secret-refresh',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtRefreshPayload) {
    const refreshToken = (request.cookies?.refresh_token as string) || null;
    if (!refreshToken || !payload) {
      throw new UnauthorizedException();
    }

    return await Promise.resolve({
      id: payload.sub,
      refreshToken,
    });
  }
}
