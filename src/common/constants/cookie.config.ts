import { CookieOptions } from 'express';

/**
 * Opciones de SameSite permitidas para cookies.
 */
export type SameSiteOption = 'strict' | 'lax' | 'none';

/**
 * Configuración de entorno para cookies.
 */
export interface CookieEnvConfig {
  /** Indica si estamos en producción */
  isProduction: boolean;
  /** Dominio de la cookie (ej: 'localhost', '.astroassist.com') */
  domain: string;
  /** Política SameSite — 'strict' por defecto */
  sameSite?: SameSiteOption;
}

/**
 * Genera opciones de cookie seguras según el entorno.
 *
 * Reglas aplicadas:
 * - httpOnly: siempre true (inaccesible desde JS del cliente)
 * - secure: true en producción (solo HTTPS)
 * - sameSite: 'strict' por defecto
 * - path: '/' por defecto
 */
export function getSecureCookieOptions(
  config: CookieEnvConfig,
  maxAgeMs: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.sameSite ?? 'strict',
    domain: config.domain,
    path: '/',
    maxAge: maxAgeMs,
  };
}
