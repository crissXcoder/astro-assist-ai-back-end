import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppException } from '../exceptions/app.exception.js';
import { ValidationError } from '../exceptions/domain-exceptions.js';
import { ErrorCode } from '../constants/error-codes.js';
import {
  ApiErrorResponse,
  ApiErrorBody,
  ValidationFieldError,
} from '../interfaces/api-response.interface.js';

/**
 * Interfaz para la respuesta tipada de HttpException de NestJS.
 * Evita usar `as any` al extraer datos de la excepción.
 */
interface NestExceptionResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Interfaz para QueryFailedError de TypeORM (MySQL/MariaDB).
 * TypeORM no exporta un tipo estricto para el error de driver.
 */
interface TypeOrmDriverError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

/**
 * Filter global de excepciones.
 *
 * Pipeline de mapeo (orden de prioridad):
 * 1. AppException (dominio) → código/mensaje propios
 * 2. HttpException (NestJS) → formato estándar humanizado
 * 3. QueryFailedError (TypeORM) → mensaje humanizado sin SQL
 * 4. Cualquier otro → 500 genérico, log completo
 *
 * Reglas aplicadas:
 * - Nunca expone stack traces al cliente
 * - Logger de NestJS (no console.error)
 * - requestId en cada respuesta de error
 * - Mensajes en español para usuario final
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.requestId ?? 'unknown';
    const path = request.url;
    const method = request.method;

    let errorBody: ApiErrorBody;

    // ── 1. AppException (dominio) ─────────────────────
    if (exception instanceof AppException) {
      errorBody = this.handleAppException(exception, path, requestId);
      this.logError(exception, method, path, requestId, errorBody.code);
    }
    // ── 2. HttpException (NestJS built-in) ────────────
    else if (exception instanceof HttpException) {
      errorBody = this.handleHttpException(exception, path, requestId);
      this.logWarning(exception, method, path, requestId);
    }
    // ── 3. QueryFailedError (TypeORM) ─────────────────
    else if (exception instanceof QueryFailedError) {
      errorBody = this.handleQueryFailedError(
        exception as QueryFailedError<Error>,
        path,
        requestId,
      );
      this.logError(
        exception as QueryFailedError<Error>,
        method,
        path,
        requestId,
        errorBody.code,
      );
    }
    // ── 4. Cualquier otra excepción ───────────────────
    else {
      errorBody = this.handleUnknownError(path, requestId);
      this.logCritical(exception, method, path, requestId);
    }

    const statusCode = this.resolveHttpStatus(exception);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: errorBody,
    };

    response.status(statusCode).json(errorResponse);
  }

  // ── Handlers privados ───────────────────────────────

  private handleAppException(
    exception: AppException,
    path: string,
    requestId: string,
  ): ApiErrorBody {
    const body: ApiErrorBody = {
      code: exception.errorCode,
      message: exception.userMessage,
      help: exception.help,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };

    // Agregar fields si es ValidationError
    if (exception instanceof ValidationError) {
      body.fields = exception.fields;
    }

    return body;
  }

  private handleHttpException(
    exception: HttpException,
    path: string,
    requestId: string,
  ): ApiErrorBody {
    const res = exception.getResponse();
    const nestResponse: NestExceptionResponse =
      typeof res === 'object' && res !== null ? res : { message: String(res) };

    let code = ErrorCode.INTERNAL_ERROR;
    let message = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
    let help: string | undefined;
    let fields: ValidationFieldError[] | undefined;

    const status: HttpStatus = exception.getStatus();

    // Mapear ValidationPipe errors (array de mensajes)
    if (Array.isArray(nestResponse.message)) {
      code = ErrorCode.VALIDATION_FAILED;
      message =
        'Algunos campos no son válidos. Revisa la información ingresada.';
      help = 'Verifica los datos enviados y corrige los campos indicados.';
      fields = nestResponse.message.map((msg) => ({
        field: this.extractFieldFromMessage(msg),
        message: msg,
      }));
    } else {
      // Mapear por código HTTP
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = ErrorCode.VALIDATION_FAILED;
          message =
            this.humanizeMessage(nestResponse.message) ??
            'La solicitud contiene datos inválidos.';
          help = 'Verifica los datos enviados e intenta de nuevo.';
          break;
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.AUTH_INVALID_CREDENTIALS;
          message =
            'Las credenciales proporcionadas no son válidas. Intenta de nuevo.';
          help = 'Verifica tu email y contraseña.';
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.FORBIDDEN_ACCESS;
          message = 'No tienes permisos para realizar esta acción.';
          help =
            'Contacta al administrador si crees que deberías tener acceso.';
          break;
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.RESOURCE_NOT_FOUND;
          message = 'El recurso solicitado no existe o fue eliminado.';
          help = 'Verifica la URL o que el recurso no haya sido eliminado.';
          break;
        case HttpStatus.CONFLICT:
          code = ErrorCode.CONFLICT;
          message =
            this.humanizeMessage(nestResponse.message) ??
            'Ya existe un registro con estos datos.';
          help = 'Usa un valor diferente e intenta de nuevo.';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = ErrorCode.RATE_LIMIT_EXCEEDED;
          message =
            'Has realizado demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
          help =
            'Reduce la frecuencia de solicitudes e intenta en unos minutos.';
          break;
        default:
          message =
            this.humanizeMessage(nestResponse.message) ??
            'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
          break;
      }
    }

    return {
      code,
      message,
      help,
      fields,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };
  }

  private handleQueryFailedError(
    exception: QueryFailedError<Error>,
    path: string,
    requestId: string,
  ): ApiErrorBody {
    const driverError = exception.driverError as TypeOrmDriverError | undefined;
    const mysqlCode = driverError?.code ?? driverError?.errno?.toString();

    let code = ErrorCode.INTERNAL_ERROR;
    let message =
      'Ocurrió un error al procesar los datos. Intenta de nuevo más tarde.';
    let help: string | undefined;
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    // Mapear errores comunes de MySQL
    switch (mysqlCode) {
      case 'ER_DUP_ENTRY':
      case '1062':
        code = ErrorCode.CONFLICT;
        message =
          'Ya existe un registro con esta información. Usa un valor diferente.';
        help =
          'Verifica que no estés duplicando datos únicos como email o identificador.';
        httpStatus = HttpStatus.CONFLICT;
        break;
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
      case '1451':
      case '1452':
        code = ErrorCode.BUSINESS_RULE_VIOLATED;
        message =
          'La operación no es válida porque un recurso relacionado no existe o no puede eliminarse.';
        help =
          'Verifica que los datos relacionados existan antes de realizar esta operación.';
        httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
        break;
      case 'ER_BAD_NULL_ERROR':
      case '1048':
        code = ErrorCode.VALIDATION_FAILED;
        message = 'Un campo requerido no fue proporcionado.';
        help = 'Revisa que todos los campos obligatorios estén completos.';
        httpStatus = HttpStatus.BAD_REQUEST;
        break;
      default:
        // Error de DB no mapeado — log completo, respuesta genérica
        break;
    }

    // Almacenar httpStatus en la respuesta para que resolveHttpStatus lo use
    // (TypeORM errors no tienen .getStatus())
    (
      exception as QueryFailedError<Error> & { _mappedStatus?: number }
    )._mappedStatus = httpStatus;

    return {
      code,
      message,
      help,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };
  }

  private handleUnknownError(path: string, requestId: string): ApiErrorBody {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message:
        'Ocurrió un error inesperado en el servidor. Nuestro equipo ha sido notificado.',
      help: 'Si el problema persiste, contacta al soporte técnico.',
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };
  }

  // ── Helpers ─────────────────────────────────────────

  private resolveHttpStatus(exception: unknown): number {
    if (exception instanceof AppException) {
      return exception.httpStatus;
    }
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof QueryFailedError) {
      const mapped = (
        exception as QueryFailedError<Error> & { _mappedStatus?: number }
      )._mappedStatus;
      return mapped ?? HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extrae el nombre del campo del mensaje de validación de class-validator.
   * Ej: "email must be an email" → "email"
   */
  private extractFieldFromMessage(message: string): string {
    const firstWord = message.split(' ')[0];
    return firstWord ?? 'unknown';
  }

  /**
   * Humaniza un mensaje solo si es string no vacío.
   * Retorna undefined si no hay mensaje válido.
   */
  private humanizeMessage(
    message: string | string[] | undefined,
  ): string | undefined {
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    return undefined;
  }

  // ── Logging ─────────────────────────────────────────

  private logError(
    exception: Error,
    method: string,
    path: string,
    requestId: string,
    errorCode: string,
  ): void {
    this.logger.error(
      `[${requestId}] ${method} ${path} → ${errorCode}: ${exception.message}`,
      exception.stack,
    );
  }

  private logWarning(
    exception: HttpException,
    method: string,
    path: string,
    requestId: string,
  ): void {
    this.logger.warn(
      `[${requestId}] ${method} ${path} → HTTP ${String(exception.getStatus())}: ${exception.message}`,
    );
  }

  private logCritical(
    exception: unknown,
    method: string,
    path: string,
    requestId: string,
  ): void {
    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[${requestId}] ${method} ${path} → CRITICAL UNHANDLED: ${message}`,
      stack,
    );
  }
}
