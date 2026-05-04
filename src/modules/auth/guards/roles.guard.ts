import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { ErrorCode } from '../../../common/constants/error-codes.js';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        errorCode: ErrorCode.AUTH_ACCESS_DENIED,
        userMessage: 'No tienes permiso para acceder a este recurso.',
      });
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException({
        errorCode: ErrorCode.AUTH_ACCESS_DENIED,
        userMessage: 'No tienes permiso para acceder a este recurso.',
      });
    }

    return true;
  }
}
