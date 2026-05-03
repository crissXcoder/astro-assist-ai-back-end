/**
 * Extensión del tipo Request de Express para incluir requestId.
 * El RequestIdMiddleware inyecta esta propiedad en cada request.
 */
declare namespace Express {
  interface Request {
    requestId: string;
  }
}
