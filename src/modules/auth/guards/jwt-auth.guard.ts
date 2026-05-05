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
import { SessionRepository } from '../repositories/session.repository.js';
import { ErrorCode } from '../../../common/constants/error-codes.js';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly sessionRepository: SessionRepository,
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

    // Ejecutar la lógica de Passport primero
    const canActivate = (await super.canActivate(context)) as boolean;
    if (!canActivate) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;

    // Verificar si la sesión ha sido revocada en la base de datos
    const sessionId = user.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_SESSION_INVALID,
        userMessage: 'Sesión inválida.',
      });
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, revokedAt: IsNull() },
    });

    if (!session) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.AUTH_SESSION_REVOKED,
        userMessage: 'Tu sesión ha sido cerrada desde otro dispositivo.',
      });
    }

    return true;
  }
}
