import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Middleware que genera un UUID único por request para trazabilidad.
 *
 * - Lo inyecta en `req.requestId`
 * - Lo propaga en el header `X-Request-ID` de la respuesta
 * - Si el cliente envía `X-Request-ID`, se reutiliza (correlación entre servicios)
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const existingId = req.headers['x-request-id'];
    const requestId =
      typeof existingId === 'string' && existingId.length > 0
        ? existingId
        : randomUUID();

    req.requestId = requestId;
    _res.setHeader('X-Request-ID', requestId);
    next();
  }
}
