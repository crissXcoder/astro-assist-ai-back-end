import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          return (request?.cookies?.access_token as string) || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload) {
      throw new UnauthorizedException();
    }

    // Aseguramos que la función sea asíncrona para cumplir con require-await si es necesario
    // o simplemente retornamos el objeto si el linter lo permite al ser una promesa.
    return await Promise.resolve({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid,
    });
  }
}
