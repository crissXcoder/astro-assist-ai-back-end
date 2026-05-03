import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiSuccessResponse } from '../interfaces/api-response.interface.js';

/**
 * Interceptor global que envuelve respuestas exitosas en formato estándar:
 * `{ success: true, data: <body>, meta: { timestamp, requestId } }`
 *
 * Exclusiones:
 * - Rutas de Swagger (`/api/docs`)
 * - Respuestas que ya fueron enviadas (streaming)
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    // No envolver respuestas de Swagger
    if (request.url.includes('/docs')) {
      return next.handle() as unknown as Observable<ApiSuccessResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.requestId ?? 'unknown',
        },
      })),
    );
  }
}
