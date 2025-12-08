/**
 * Comprehensive Error Handling System
 * 
 * Provides:
 * - Custom error classes with HTTP status codes
 * - Structured error responses with error codes
 * - Request validation utilities
 * - Error logging with context
 * - Try-catch wrappers for async operations
 */

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════

export const ErrorCodes = {
  // Authentication (1xxx)
  AUTH_REQUIRED: 'E1001',
  AUTH_INVALID_TOKEN: 'E1002',
  AUTH_EXPIRED_TOKEN: 'E1003',
  AUTH_INVALID_CREDENTIALS: 'E1004',
  AUTH_INSUFFICIENT_PERMISSIONS: 'E1005',
  AUTH_SESSION_EXPIRED: 'E1006',
  AUTH_ACCOUNT_DISABLED: 'E1007',
  AUTH_EMAIL_NOT_VERIFIED: 'E1008',

  // Validation (2xxx)
  VALIDATION_FAILED: 'E2001',
  VALIDATION_REQUIRED_FIELD: 'E2002',
  VALIDATION_INVALID_FORMAT: 'E2003',
  VALIDATION_INVALID_TYPE: 'E2004',
  VALIDATION_OUT_OF_RANGE: 'E2005',
  VALIDATION_INVALID_EMAIL: 'E2006',
  VALIDATION_INVALID_DATE: 'E2007',
  VALIDATION_STRING_TOO_LONG: 'E2008',
  VALIDATION_STRING_TOO_SHORT: 'E2009',
  VALIDATION_ARRAY_TOO_LONG: 'E2010',

  // Resource (3xxx)
  RESOURCE_NOT_FOUND: 'E3001',
  RESOURCE_ALREADY_EXISTS: 'E3002',
  RESOURCE_DELETED: 'E3003',
  RESOURCE_CONFLICT: 'E3004',
  RESOURCE_LOCKED: 'E3005',

  // Database (4xxx)
  DATABASE_ERROR: 'E4001',
  DATABASE_CONNECTION_FAILED: 'E4002',
  DATABASE_QUERY_FAILED: 'E4003',
  DATABASE_CONSTRAINT_VIOLATION: 'E4004',
  DATABASE_TRANSACTION_FAILED: 'E4005',

  // External Service (5xxx)
  EXTERNAL_SERVICE_ERROR: 'E5001',
  EXTERNAL_SERVICE_TIMEOUT: 'E5002',
  EXTERNAL_SERVICE_UNAVAILABLE: 'E5003',
  EXTERNAL_API_ERROR: 'E5004',

  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED: 'E6001',
  TOO_MANY_REQUESTS: 'E6002',

  // Server (9xxx)
  INTERNAL_ERROR: 'E9001',
  NOT_IMPLEMENTED: 'E9002',
  SERVICE_UNAVAILABLE: 'E9003',
  UNKNOWN_ERROR: 'E9999',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ═══════════════════════════════════════════════════════════════════════════
// HTTP STATUS CODES
// ═══════════════════════════════════════════════════════════════════════════

export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];

// ═══════════════════════════════════════════════════════════════════════════
// BASE APP ERROR
// ═══════════════════════════════════════════════════════════════════════════

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  params?: Record<string, unknown>;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  expected?: string;
  received?: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly details?: ErrorDetails[];
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.UNKNOWN_ERROR,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: {
      isOperational?: boolean;
      context?: ErrorContext;
      details?: ErrorDetails[];
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.context = options?.context;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
        ...(process.env.NODE_ENV === 'development' && {
          stack: this.stack,
          context: this.context,
        }),
      },
    };
  }

  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIFIC ERROR CLASSES
// ═══════════════════════════════════════════════════════════════════════════

/** 400 Bad Request */
export class BadRequestError extends AppError {
  constructor(
    message = 'Bad request',
    code: ErrorCode = ErrorCodes.VALIDATION_FAILED,
    options?: { context?: ErrorContext; details?: ErrorDetails[] }
  ) {
    super(message, code, HttpStatus.BAD_REQUEST, options);
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends AppError {
  constructor(
    message = 'Authentication required',
    code: ErrorCode = ErrorCodes.AUTH_REQUIRED,
    options?: { context?: ErrorContext; details?: ErrorDetails[]; cause?: Error }
  ) {
    super(message, code, HttpStatus.UNAUTHORIZED, options);
  }
}

/** 403 Forbidden */
export class ForbiddenError extends AppError {
  constructor(
    message = 'Access denied',
    code: ErrorCode = ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
    options?: { context?: ErrorContext; details?: ErrorDetails[]; cause?: Error }
  ) {
    super(message, code, HttpStatus.FORBIDDEN, options);
  }
}

/** 404 Not Found */
export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    code: ErrorCode = ErrorCodes.RESOURCE_NOT_FOUND,
    options?: { context?: ErrorContext; details?: ErrorDetails[]; cause?: Error }
  ) {
    super(message, code, HttpStatus.NOT_FOUND, options);
  }
}

/** 409 Conflict */
export class ConflictError extends AppError {
  constructor(
    message = 'Resource conflict',
    code: ErrorCode = ErrorCodes.RESOURCE_CONFLICT,
    options?: { context?: ErrorContext; details?: ErrorDetails[] }
  ) {
    super(message, code, HttpStatus.CONFLICT, options);
  }
}

/** 422 Unprocessable Entity */
export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details?: ErrorDetails[],
    options?: { context?: ErrorContext }
  ) {
    super(message, ErrorCodes.VALIDATION_FAILED, HttpStatus.UNPROCESSABLE_ENTITY, {
      ...options,
      details,
    });
  }
}

/** 429 Too Many Requests */
export class RateLimitError extends AppError {
  constructor(
    message = 'Rate limit exceeded',
    options?: { context?: ErrorContext; retryAfter?: number }
  ) {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS, options);
  }
}

/** 500 Internal Server Error */
export class InternalError extends AppError {
  constructor(
    message = 'Internal server error',
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    super(message, code, HttpStatus.INTERNAL_SERVER_ERROR, {
      ...options,
      isOperational: false,
    });
  }
}

/** 503 Service Unavailable */
export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Service temporarily unavailable',
    options?: { context?: ErrorContext }
  ) {
    super(message, ErrorCodes.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE, options);
  }
}

/** Database Error */
export class DatabaseError extends AppError {
  constructor(
    message = 'Database error',
    code: ErrorCode = ErrorCodes.DATABASE_ERROR,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    super(message, code, HttpStatus.INTERNAL_SERVER_ERROR, {
      ...options,
      isOperational: false,
    });
  }
}

/** External Service Error */
export class ExternalServiceError extends AppError {
  constructor(
    message = 'External service error',
    code: ErrorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    super(message, code, HttpStatus.BAD_GATEWAY, options);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR LOGGING
// ═══════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
  context?: ErrorContext;
  timestamp: string;
}

class ErrorLogger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName = 'scoutpulse', environment = process.env.NODE_ENV || 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      service: this.serviceName,
      environment: this.environment,
    });
  }

  private log(level: LogLevel, message: string, error?: Error, context?: ErrorContext) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        code: error instanceof AppError ? error.code : undefined,
        stack: this.environment === 'development' ? error.stack : undefined,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        break;
    }

    return entry;
  }

  debug(message: string, context?: ErrorContext) {
    return this.log('debug', message, undefined, context);
  }

  info(message: string, context?: ErrorContext) {
    return this.log('info', message, undefined, context);
  }

  warn(message: string, error?: Error, context?: ErrorContext) {
    return this.log('warn', message, error, context);
  }

  error(message: string, error?: Error, context?: ErrorContext) {
    return this.log('error', message, error, context);
  }

  fatal(message: string, error?: Error, context?: ErrorContext) {
    return this.log('fatal', message, error, context);
  }

  /** Log an AppError with full context */
  logAppError(error: AppError, additionalContext?: ErrorContext) {
    const context = { ...error.context, ...additionalContext };
    
    if (error.isOperational) {
      return this.warn(`Operational error: ${error.message}`, error, context);
    } else {
      return this.error(`System error: ${error.message}`, error, context);
    }
  }
}

export const logger = new ErrorLogger();

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
  code?: ErrorCode;
};

export type FieldValidation = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  rules?: ValidationRule<unknown>[];
};

export type ValidationSchema = Record<string, FieldValidation>;

export function validateField(
  field: string,
  value: unknown,
  validation: FieldValidation
): ErrorDetails[] {
  const errors: ErrorDetails[] = [];

  // Required check
  if (validation.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field,
      constraint: 'required',
      message: `${field} is required`,
    });
    return errors; // Stop here if required field is missing
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Type check
  if (validation.type) {
    let isValidType = false;

    switch (validation.type) {
      case 'string':
        isValidType = typeof value === 'string';
        break;
      case 'number':
        isValidType = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValidType = typeof value === 'boolean';
        break;
      case 'array':
        isValidType = Array.isArray(value);
        break;
      case 'object':
        isValidType = typeof value === 'object' && !Array.isArray(value) && value !== null;
        break;
      case 'date':
        isValidType = value instanceof Date || !isNaN(Date.parse(String(value)));
        break;
    }

    if (!isValidType) {
      errors.push({
        field,
        constraint: 'type',
        expected: validation.type,
        received: typeof value,
        message: `${field} must be a ${validation.type}`,
      });
      return errors;
    }
  }

  // Custom rules
  if (validation.rules) {
    for (const rule of validation.rules) {
      if (!rule.validate(value)) {
        errors.push({
          field,
          constraint: 'custom',
          value,
          message: rule.message,
        });
      }
    }
  }

  return errors;
}

export function validate<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema
): { valid: boolean; errors: ErrorDetails[] } {
  const allErrors: ErrorDetails[] = [];

  for (const [field, validation] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = validateField(field, value, validation);
    allErrors.push(...fieldErrors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function assertValid<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema,
  message = 'Validation failed'
): void {
  const result = validate(data, schema);
  
  if (!result.valid) {
    throw new ValidationError(message, result.errors);
  }
}

// Common validation rules
export const rules = {
  email: {
    validate: (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Invalid email format',
    code: ErrorCodes.VALIDATION_INVALID_EMAIL,
  } as ValidationRule,

  minLength: (min: number): ValidationRule<string> => ({
    validate: (v) => typeof v === 'string' && v.length >= min,
    message: `Must be at least ${min} characters`,
    code: ErrorCodes.VALIDATION_STRING_TOO_SHORT,
  }),

  maxLength: (max: number): ValidationRule<string> => ({
    validate: (v) => typeof v === 'string' && v.length <= max,
    message: `Must be at most ${max} characters`,
    code: ErrorCodes.VALIDATION_STRING_TOO_LONG,
  }),

  min: (min: number): ValidationRule<number> => ({
    validate: (v) => typeof v === 'number' && v >= min,
    message: `Must be at least ${min}`,
    code: ErrorCodes.VALIDATION_OUT_OF_RANGE,
  }),

  max: (max: number): ValidationRule<number> => ({
    validate: (v) => typeof v === 'number' && v <= max,
    message: `Must be at most ${max}`,
    code: ErrorCodes.VALIDATION_OUT_OF_RANGE,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (v) => typeof v === 'string' && regex.test(v),
    message,
    code: ErrorCodes.VALIDATION_INVALID_FORMAT,
  }),

  oneOf: <T>(values: T[]): ValidationRule<T> => ({
    validate: (v) => values.includes(v),
    message: `Must be one of: ${values.join(', ')}`,
    code: ErrorCodes.VALIDATION_INVALID_FORMAT,
  }),

  uuid: {
    validate: (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    message: 'Invalid UUID format',
    code: ErrorCodes.VALIDATION_INVALID_FORMAT,
  } as ValidationRule,

  date: {
    validate: (v: unknown) => !isNaN(Date.parse(String(v))),
    message: 'Invalid date format',
    code: ErrorCodes.VALIDATION_INVALID_DATE,
  } as ValidationRule,

  url: {
    validate: (v: unknown) => {
      try {
        new URL(String(v));
        return true;
      } catch {
        return false;
      }
    },
    message: 'Invalid URL format',
    code: ErrorCodes.VALIDATION_INVALID_FORMAT,
  } as ValidationRule,
};

// ═══════════════════════════════════════════════════════════════════════════
// TRY-CATCH WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════

export type AsyncResult<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Wrap an async function with error handling */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const appError = normalizeError(error, context);
    logger.logAppError(appError, context);
    return { success: false, error: appError };
  }
}

/** Wrap an async function and throw normalized errors */
export async function tryOrThrow<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  context?: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = normalizeError(error, context);
    if (errorMessage) {
      appError.message = errorMessage;
    }
    logger.logAppError(appError, context);
    throw appError;
  }
}

/** Normalize any error to AppError */
export function normalizeError(error: unknown, context?: ErrorContext): AppError {
  if (error instanceof AppError) {
    if (context) {
      error.context && Object.assign(error.context, context);
    }
    return error;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('does not exist')) {
      return new NotFoundError(error.message, ErrorCodes.RESOURCE_NOT_FOUND, {
        context,
        cause: error,
      });
    }

    if (message.includes('unauthorized') || message.includes('unauthenticated')) {
      return new UnauthorizedError(error.message, ErrorCodes.AUTH_REQUIRED, {
        context,
        cause: error,
      });
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return new ForbiddenError(error.message, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS, {
        context,
        cause: error,
      });
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new BadRequestError(error.message, ErrorCodes.VALIDATION_FAILED, {
        context,
      });
    }

    if (message.includes('timeout')) {
      return new ExternalServiceError(error.message, ErrorCodes.EXTERNAL_SERVICE_TIMEOUT, {
        context,
        cause: error,
      });
    }

    return new InternalError(error.message, ErrorCodes.INTERNAL_ERROR, {
      context,
      cause: error,
    });
  }

  // Unknown error type
  return new InternalError(
    typeof error === 'string' ? error : 'An unexpected error occurred',
    ErrorCodes.UNKNOWN_ERROR,
    { context }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails[];
    timestamp: string;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(data: T, meta?: SuccessResponse<T>['meta']): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(error: AppError): ErrorResponse {
  return error.toResponse() as ErrorResponse;
}

/** Create Next.js Response from AppError */
export function createErrorResponse(error: AppError): Response {
  return Response.json(errorResponse(error), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/** Create Next.js Response from success data */
export function createSuccessResponse<T>(
  data: T,
  status: HttpStatusCode = HttpStatus.OK,
  meta?: SuccessResponse<T>['meta']
): Response {
  return Response.json(successResponse(data, meta), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLER WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

type RouteHandler = (
  request: Request,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestContext: ErrorContext = {
      requestId: crypto.randomUUID(),
      path: new URL(request.url).pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    try {
      return await handler(request, context);
    } catch (error) {
      const appError = normalizeError(error, requestContext);
      logger.logAppError(appError, requestContext);
      return createErrorResponse(appError);
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST PARSING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request,
  schema?: ValidationSchema
): Promise<T> {
  let body: T;

  try {
    body = await request.json();
  } catch {
    throw new BadRequestError('Invalid JSON body', ErrorCodes.VALIDATION_FAILED);
  }

  if (schema) {
    assertValid(body as Record<string, unknown>, schema);
  }

  return body;
}

export function parseSearchParams(
  request: Request,
  schema?: ValidationSchema
): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (schema) {
    assertValid(params, schema);
  }

  return params;
}

export function requireAuth(request: Request): string {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    throw new UnauthorizedError('Authorization header required');
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid authorization format', ErrorCodes.AUTH_INVALID_TOKEN);
  }

  return token;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Error classes
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,

  // Utilities
  ErrorCodes,
  HttpStatus,
  logger,
  rules,

  // Functions
  validate,
  assertValid,
  tryCatch,
  tryOrThrow,
  normalizeError,
  successResponse,
  errorResponse,
  createErrorResponse,
  createSuccessResponse,
  withErrorHandler,
  parseJsonBody,
  parseSearchParams,
  requireAuth,
};
