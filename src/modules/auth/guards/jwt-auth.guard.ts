import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Session } from '../entities/session.entity.js';
import { ErrorCode } from '../../../common/constants/error-codes.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Ejecutar lógica base de passport (JwtStrategy.validate)
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Validar que el usuario esté activo (ya se hace en strategy usualmente, pero reforzamos)
    if (!user) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_ACCESS_DENIED,
        userMessage: 'Usuario no autenticado.',
      });
    }

    // 2. Validar sesión en DB si existe sessionId (sid)
    if (user.sessionId) {
      const session = await this.sessionRepository.findOne({
        where: { id: user.sessionId, revokedAt: IsNull() },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException({
          errorCode: ErrorCode.AUTH_SESSION_EXPIRED,
          userMessage:
            'Tu sesión ha expirado o ha sido revocada. Inicia sesión de nuevo.',
        });
      }
    }

    return true;
  }
}
