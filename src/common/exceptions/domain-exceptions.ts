import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.js';
import { ValidationFieldError } from '../interfaces/api-response.interface.js';
import { AppException } from './app.exception.js';

// ── ApiError ────────────────────────────────────────────
// Regla de negocio violada o estado inválido.
export class ApiError extends AppException {
  constructor(params: {
    errorCode?: ErrorCode;
    userMessage: string;
    help?: string;
    httpStatus?: HttpStatus;
    internalMessage?: string;
  }) {
    super({
      errorCode: params.errorCode ?? ErrorCode.BUSINESS_RULE_VIOLATED,
      userMessage: params.userMessage,
      help: params.help,
      httpStatus: params.httpStatus ?? HttpStatus.UNPROCESSABLE_ENTITY,
      internalMessage: params.internalMessage,
    });
  }
}

// ── ValidationError ─────────────────────────────────────
// Input del usuario inválido — incluye detalle por campo.
export class ValidationError extends AppException {
  readonly fields: ValidationFieldError[];

  constructor(params: {
    userMessage?: string;
    help?: string;
    fields: ValidationFieldError[];
    internalMessage?: string;
  }) {
    super({
      errorCode: ErrorCode.VALIDATION_FAILED,
      userMessage:
        params.userMessage ??
        'Algunos campos no son válidos. Revisa la información ingresada.',
      help: params.help,
      httpStatus: HttpStatus.BAD_REQUEST,
      internalMessage: params.internalMessage,
    });
    this.fields = params.fields;
  }
}

// ── NotFoundError ───────────────────────────────────────
// Recurso solicitado no existe.
export class NotFoundError extends AppException {
  constructor(params: {
    resource: string;
    help?: string;
    internalMessage?: string;
  }) {
    super({
      errorCode: ErrorCode.RESOURCE_NOT_FOUND,
      userMessage: `El ${params.resource} solicitado no existe o fue eliminado.`,
      help:
        params.help ??
        'Verifica que el identificador sea correcto o que el recurso no haya sido eliminado.',
      httpStatus: HttpStatus.NOT_FOUND,
      internalMessage: params.internalMessage,
    });
  }
}

// ── AuthError ───────────────────────────────────────────
// No autenticado — mensaje genérico siempre (no revelar si usuario existe).
export class AuthError extends AppException {
  constructor(params?: {
    errorCode?: ErrorCode;
    help?: string;
    internalMessage?: string;
  }) {
    super({
      errorCode: params?.errorCode ?? ErrorCode.AUTH_INVALID_CREDENTIALS,
      userMessage:
        'Las credenciales proporcionadas no son válidas. Intenta de nuevo.',
      help:
        params?.help ??
        'Verifica tu email y contraseña. Si olvidaste tu contraseña, usa la opción de recuperación.',
      httpStatus: HttpStatus.UNAUTHORIZED,
      internalMessage: params?.internalMessage,
    });
  }
}

// ── ForbiddenError ──────────────────────────────────────
// Autenticado pero sin permisos.
export class ForbiddenError extends AppException {
  constructor(params?: {
    userMessage?: string;
    help?: string;
    internalMessage?: string;
  }) {
    super({
      errorCode: ErrorCode.FORBIDDEN_ACCESS,
      userMessage:
        params?.userMessage ?? 'No tienes permisos para realizar esta acción.',
      help:
        params?.help ??
        'Contacta al administrador si crees que deberías tener acceso.',
      httpStatus: HttpStatus.FORBIDDEN,
      internalMessage: params?.internalMessage,
    });
  }
}

// ── ConflictError ───────────────────────────────────────
// Recurso duplicado o conflicto de estado.
export class ConflictError extends AppException {
  constructor(params: {
    errorCode?: ErrorCode;
    userMessage: string;
    help?: string;
    internalMessage?: string;
  }) {
    super({
      errorCode: params.errorCode ?? ErrorCode.CONFLICT,
      userMessage: params.userMessage,
      help: params.help ?? 'Usa un valor diferente e intenta de nuevo.',
      httpStatus: HttpStatus.CONFLICT,
      internalMessage: params.internalMessage,
    });
  }
}
