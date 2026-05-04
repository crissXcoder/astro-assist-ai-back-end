import { Role } from '../../users/enums/role.enum.js';

/**
 * Interface que representa al usuario autenticado en el Request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  sessionId: string;
}

/**
 * Payload del JWT (Access Token)
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  sid: string; // Session ID
}

/**
 * Payload del Refresh Token
 */
export interface JwtRefreshPayload {
  sub: string;
  refreshToken: string;
}
