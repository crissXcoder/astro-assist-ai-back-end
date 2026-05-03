import { ErrorCode } from '../constants/error-codes.js';

/**
 * Metadata común en todas las respuestas de la API.
 */
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
}

/**
 * Error de campo individual para respuestas de validación.
 */
export interface ValidationFieldError {
  field: string;
  message: string;
  received?: string;
  expected?: string;
}

/**
 * Cuerpo del bloque de error en respuestas fallidas.
 */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  help?: string;
  fields?: ValidationFieldError[];
  timestamp: string;
  path: string;
  requestId: string;
}

/**
 * Respuesta exitosa estándar de la API.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

/**
 * Respuesta de error estándar de la API.
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}
