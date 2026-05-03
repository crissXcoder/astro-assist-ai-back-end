/**
 * Códigos de error centralizados para toda la API.
 * Frontend consume estos códigos para determinar la acción a tomar.
 * Convención: DOMINIO_DESCRIPCION en SCREAMING_SNAKE_CASE.
 */
export enum ErrorCode {
  // ── Auth ──────────────────────────────────────────────
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_SESSION_REVOKED = 'AUTH_SESSION_REVOKED',
  AUTH_SESSION_MISSING = 'AUTH_SESSION_MISSING',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_MISSING = 'AUTH_REFRESH_TOKEN_MISSING',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_ACCESS_DENIED = 'AUTH_ACCESS_DENIED',

  // ── Users ─────────────────────────────────────────────
  USER_EMAIL_ALREADY_EXISTS = 'USER_EMAIL_ALREADY_EXISTS',
  USER_ID_ALREADY_EXISTS = 'USER_ID_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // ── Validación ────────────────────────────────────────
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // ── Recursos ──────────────────────────────────────────
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // ── Autorización ──────────────────────────────────────
  FORBIDDEN_ACCESS = 'FORBIDDEN_ACCESS',

  // ── Conflictos ────────────────────────────────────────
  CONFLICT = 'CONFLICT',

  // ── Reglas de negocio ─────────────────────────────────
  BUSINESS_RULE_VIOLATED = 'BUSINESS_RULE_VIOLATED',
  INVALID_STATE = 'INVALID_STATE',

  // ── Rate Limiting ─────────────────────────────────────
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // ── Interno ───────────────────────────────────────────
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
