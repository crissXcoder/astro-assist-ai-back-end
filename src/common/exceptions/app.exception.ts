import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes.js';

/**
 * Excepción base de la aplicación.
 *
 * Los servicios lanzan AppException (o sus hijas).
 * El AllExceptionsFilter las mapea a respuestas HTTP.
 * Los servicios NO conocen HTTP — solo definen el contrato de error.
 */
export class AppException extends Error {
  /** Código de error que el frontend consume para routing */
  readonly errorCode: ErrorCode;
  /** Mensaje humanizado en español para el usuario final */
  readonly userMessage: string;
  /** Instrucción accionable para el usuario */
  readonly help?: string;
  /** Código HTTP sugerido para el filter */
  readonly httpStatus: HttpStatus;

  constructor(params: {
    errorCode: ErrorCode;
    userMessage: string;
    help?: string;
    httpStatus: HttpStatus;
    /** Mensaje técnico para logs internos (no se expone al cliente) */
    internalMessage?: string;
  }) {
    super(params.internalMessage ?? params.userMessage);
    this.name = this.constructor.name;
    this.errorCode = params.errorCode;
    this.userMessage = params.userMessage;
    this.help = params.help;
    this.httpStatus = params.httpStatus;
  }
}
