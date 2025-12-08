/**
 * Authentication Error Handling System
 * 
 * Provides comprehensive error handling for:
 * - Validation errors (400)
 * - Authentication failures (401)
 * - Rate limiting (429)
 * - Server errors (500)
 * - Detailed error messages for different failure scenarios
 */

import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  RateLimitError,
  InternalError,
  ValidationError,
  ErrorCodes,
  HttpStatus,
  logger,
  type ErrorContext,
  type ErrorDetails,
} from '@/lib/errors';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════

export const AuthErrorCodes = {
  // Validation (AUTH_VAL_xxx)
  VALIDATION_EMAIL_REQUIRED: 'AUTH_VAL_001',
  VALIDATION_EMAIL_INVALID: 'AUTH_VAL_002',
  VALIDATION_PASSWORD_REQUIRED: 'AUTH_VAL_003',
  VALIDATION_PASSWORD_TOO_SHORT: 'AUTH_VAL_004',
  VALIDATION_PASSWORD_TOO_WEAK: 'AUTH_VAL_005',
  VALIDATION_PASSWORD_MISMATCH: 'AUTH_VAL_006',
  VALIDATION_NAME_REQUIRED: 'AUTH_VAL_007',
  VALIDATION_PHONE_INVALID: 'AUTH_VAL_008',
  VALIDATION_DOB_INVALID: 'AUTH_VAL_009',
  VALIDATION_ROLE_INVALID: 'AUTH_VAL_010',

  // Authentication (AUTH_xxx)
  INVALID_CREDENTIALS: 'AUTH_001',
  EMAIL_NOT_FOUND: 'AUTH_002',
  WRONG_PASSWORD: 'AUTH_003',
  ACCOUNT_DISABLED: 'AUTH_004',
  ACCOUNT_LOCKED: 'AUTH_005',
  ACCOUNT_NOT_VERIFIED: 'AUTH_006',
  EMAIL_ALREADY_EXISTS: 'AUTH_007',
  
  // Token (AUTH_TOKEN_xxx)
  TOKEN_MISSING: 'AUTH_TOKEN_001',
  TOKEN_INVALID: 'AUTH_TOKEN_002',
  TOKEN_EXPIRED: 'AUTH_TOKEN_003',
  TOKEN_REVOKED: 'AUTH_TOKEN_004',
  REFRESH_TOKEN_INVALID: 'AUTH_TOKEN_005',
  REFRESH_TOKEN_EXPIRED: 'AUTH_TOKEN_006',

  // Session (AUTH_SESSION_xxx)
  SESSION_NOT_FOUND: 'AUTH_SESSION_001',
  SESSION_EXPIRED: 'AUTH_SESSION_002',
  SESSION_INVALID: 'AUTH_SESSION_003',
  TOO_MANY_SESSIONS: 'AUTH_SESSION_004',

  // MFA (AUTH_MFA_xxx)
  MFA_REQUIRED: 'AUTH_MFA_001',
  MFA_CODE_INVALID: 'AUTH_MFA_002',
  MFA_CODE_EXPIRED: 'AUTH_MFA_003',
  MFA_NOT_ENABLED: 'AUTH_MFA_004',
  MFA_ALREADY_ENABLED: 'AUTH_MFA_005',

  // OAuth (AUTH_OAUTH_xxx)
  OAUTH_PROVIDER_ERROR: 'AUTH_OAUTH_001',
  OAUTH_EMAIL_NOT_PROVIDED: 'AUTH_OAUTH_002',
  OAUTH_ACCOUNT_LINKED: 'AUTH_OAUTH_003',
  OAUTH_ACCOUNT_NOT_LINKED: 'AUTH_OAUTH_004',

  // Password Reset (AUTH_RESET_xxx)
  RESET_TOKEN_INVALID: 'AUTH_RESET_001',
  RESET_TOKEN_EXPIRED: 'AUTH_RESET_002',
  RESET_TOO_MANY_ATTEMPTS: 'AUTH_RESET_003',

  // Rate Limiting (AUTH_RATE_xxx)
  RATE_LIMIT_LOGIN: 'AUTH_RATE_001',
  RATE_LIMIT_REGISTER: 'AUTH_RATE_002',
  RATE_LIMIT_PASSWORD_RESET: 'AUTH_RATE_003',
  RATE_LIMIT_VERIFICATION: 'AUTH_RATE_004',
  RATE_LIMIT_MFA: 'AUTH_RATE_005',

  // Server (AUTH_SERVER_xxx)
  SERVER_ERROR: 'AUTH_SERVER_001',
  DATABASE_ERROR: 'AUTH_SERVER_002',
  EMAIL_SERVICE_ERROR: 'AUTH_SERVER_003',
  OAUTH_SERVICE_ERROR: 'AUTH_SERVER_004',
} as const;

export type AuthErrorCode = typeof AuthErrorCodes[keyof typeof AuthErrorCodes];

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

export const AuthErrorMessages: Record<AuthErrorCode, string> = {
  // Validation
  [AuthErrorCodes.VALIDATION_EMAIL_REQUIRED]: 'Email address is required',
  [AuthErrorCodes.VALIDATION_EMAIL_INVALID]: 'Please enter a valid email address',
  [AuthErrorCodes.VALIDATION_PASSWORD_REQUIRED]: 'Password is required',
  [AuthErrorCodes.VALIDATION_PASSWORD_TOO_SHORT]: 'Password must be at least 8 characters',
  [AuthErrorCodes.VALIDATION_PASSWORD_TOO_WEAK]: 'Password must contain uppercase, lowercase, number, and special character',
  [AuthErrorCodes.VALIDATION_PASSWORD_MISMATCH]: 'Passwords do not match',
  [AuthErrorCodes.VALIDATION_NAME_REQUIRED]: 'Name is required',
  [AuthErrorCodes.VALIDATION_PHONE_INVALID]: 'Please enter a valid phone number',
  [AuthErrorCodes.VALIDATION_DOB_INVALID]: 'Please enter a valid date of birth',
  [AuthErrorCodes.VALIDATION_ROLE_INVALID]: 'Please select a valid role',

  // Authentication
  [AuthErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
  [AuthErrorCodes.EMAIL_NOT_FOUND]: 'No account found with this email',
  [AuthErrorCodes.WRONG_PASSWORD]: 'Incorrect password',
  [AuthErrorCodes.ACCOUNT_DISABLED]: 'This account has been disabled. Please contact support.',
  [AuthErrorCodes.ACCOUNT_LOCKED]: 'Account temporarily locked due to too many failed attempts. Try again later.',
  [AuthErrorCodes.ACCOUNT_NOT_VERIFIED]: 'Please verify your email address before signing in',
  [AuthErrorCodes.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',

  // Token
  [AuthErrorCodes.TOKEN_MISSING]: 'Authentication token is required',
  [AuthErrorCodes.TOKEN_INVALID]: 'Invalid authentication token',
  [AuthErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCodes.TOKEN_REVOKED]: 'This token has been revoked',
  [AuthErrorCodes.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [AuthErrorCodes.REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired. Please sign in again.',

  // Session
  [AuthErrorCodes.SESSION_NOT_FOUND]: 'Session not found',
  [AuthErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCodes.SESSION_INVALID]: 'Invalid session',
  [AuthErrorCodes.TOO_MANY_SESSIONS]: 'Maximum number of active sessions reached',

  // MFA
  [AuthErrorCodes.MFA_REQUIRED]: 'Two-factor authentication is required',
  [AuthErrorCodes.MFA_CODE_INVALID]: 'Invalid verification code',
  [AuthErrorCodes.MFA_CODE_EXPIRED]: 'Verification code has expired. Please request a new one.',
  [AuthErrorCodes.MFA_NOT_ENABLED]: 'Two-factor authentication is not enabled',
  [AuthErrorCodes.MFA_ALREADY_ENABLED]: 'Two-factor authentication is already enabled',

  // OAuth
  [AuthErrorCodes.OAUTH_PROVIDER_ERROR]: 'Authentication provider error. Please try again.',
  [AuthErrorCodes.OAUTH_EMAIL_NOT_PROVIDED]: 'Email address not provided by authentication provider',
  [AuthErrorCodes.OAUTH_ACCOUNT_LINKED]: 'This account is already linked to another user',
  [AuthErrorCodes.OAUTH_ACCOUNT_NOT_LINKED]: 'No linked account found for this provider',

  // Password Reset
  [AuthErrorCodes.RESET_TOKEN_INVALID]: 'Invalid or expired reset link. Please request a new one.',
  [AuthErrorCodes.RESET_TOKEN_EXPIRED]: 'Reset link has expired. Please request a new one.',
  [AuthErrorCodes.RESET_TOO_MANY_ATTEMPTS]: 'Too many password reset attempts. Please try again later.',

  // Rate Limiting
  [AuthErrorCodes.RATE_LIMIT_LOGIN]: 'Too many login attempts. Please wait before trying again.',
  [AuthErrorCodes.RATE_LIMIT_REGISTER]: 'Too many registration attempts. Please wait before trying again.',
  [AuthErrorCodes.RATE_LIMIT_PASSWORD_RESET]: 'Too many password reset requests. Please wait before trying again.',
  [AuthErrorCodes.RATE_LIMIT_VERIFICATION]: 'Too many verification attempts. Please wait before trying again.',
  [AuthErrorCodes.RATE_LIMIT_MFA]: 'Too many verification code attempts. Please wait before trying again.',

  // Server
  [AuthErrorCodes.SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
  [AuthErrorCodes.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [AuthErrorCodes.EMAIL_SERVICE_ERROR]: 'Failed to send email. Please try again later.',
  [AuthErrorCodes.OAUTH_SERVICE_ERROR]: 'Authentication service unavailable. Please try again later.',
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ERROR CLASSES
// ═══════════════════════════════════════════════════════════════════════════

/** Base Auth Error */
export class AuthError extends AppError {
  public readonly authCode: AuthErrorCode;

  constructor(
    authCode: AuthErrorCode,
    statusCode: number = HttpStatus.UNAUTHORIZED,
    options?: {
      context?: ErrorContext;
      details?: ErrorDetails[];
      cause?: Error;
      customMessage?: string;
    }
  ) {
    const message = options?.customMessage || AuthErrorMessages[authCode];
    super(message, ErrorCodes.AUTH_REQUIRED, statusCode as typeof HttpStatus.OK, options);
    this.authCode = authCode;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      error: {
        ...super.toJSON().error,
        authCode: this.authCode,
      },
    };
  }

  getAuthResponse() {
    return {
      success: false as const,
      error: {
        code: this.authCode,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION ERRORS (400)
// ═══════════════════════════════════════════════════════════════════════════

export class AuthValidationError extends AuthError {
  constructor(
    authCode: AuthErrorCode,
    options?: {
      field?: string;
      value?: unknown;
      context?: ErrorContext;
    }
  ) {
    super(authCode, HttpStatus.BAD_REQUEST, {
      context: options?.context,
      details: options?.field ? [{
        field: options.field,
        value: options.value,
        message: AuthErrorMessages[authCode],
      }] : undefined,
    });
  }
}

/** Email validation error */
export class EmailValidationError extends AuthValidationError {
  constructor(email?: string, context?: ErrorContext) {
    const code = !email 
      ? AuthErrorCodes.VALIDATION_EMAIL_REQUIRED 
      : AuthErrorCodes.VALIDATION_EMAIL_INVALID;
    super(code, { field: 'email', value: email, context });
  }
}

/** Password validation error */
export class PasswordValidationError extends AuthValidationError {
  constructor(
    type: 'required' | 'short' | 'weak' | 'mismatch',
    context?: ErrorContext
  ) {
    const codeMap = {
      required: AuthErrorCodes.VALIDATION_PASSWORD_REQUIRED,
      short: AuthErrorCodes.VALIDATION_PASSWORD_TOO_SHORT,
      weak: AuthErrorCodes.VALIDATION_PASSWORD_TOO_WEAK,
      mismatch: AuthErrorCodes.VALIDATION_PASSWORD_MISMATCH,
    };
    super(codeMap[type], { field: 'password', context });
  }
}

/** Multiple validation errors */
export class AuthMultiValidationError extends AuthError {
  constructor(
    errors: Array<{ field: string; code: AuthErrorCode; value?: unknown }>,
    context?: ErrorContext
  ) {
    super(AuthErrorCodes.VALIDATION_EMAIL_REQUIRED, HttpStatus.BAD_REQUEST, {
      context,
      details: errors.map(e => ({
        field: e.field,
        value: e.value,
        message: AuthErrorMessages[e.code],
        code: e.code,
      })),
      customMessage: 'Validation failed',
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION ERRORS (401)
// ═══════════════════════════════════════════════════════════════════════════

/** Invalid credentials error */
export class InvalidCredentialsError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Email not found error */
export class EmailNotFoundError extends AuthError {
  constructor(email?: string, context?: ErrorContext) {
    // Don't expose whether email exists - use generic message
    super(AuthErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, {
      context: { ...context, email },
    });
  }
}

/** Wrong password error */
export class WrongPasswordError extends AuthError {
  constructor(context?: ErrorContext) {
    // Don't expose that password specifically was wrong
    super(AuthErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Account disabled error */
export class AccountDisabledError extends AuthError {
  constructor(reason?: string, context?: ErrorContext) {
    super(AuthErrorCodes.ACCOUNT_DISABLED, HttpStatus.UNAUTHORIZED, {
      context,
      customMessage: reason 
        ? `This account has been disabled: ${reason}`
        : AuthErrorMessages[AuthErrorCodes.ACCOUNT_DISABLED],
    });
  }
}

/** Account locked error */
export class AccountLockedError extends AuthError {
  public readonly unlockAt?: Date;
  public readonly remainingMinutes?: number;

  constructor(options?: { unlockAt?: Date; context?: ErrorContext }) {
    const remaining = options?.unlockAt 
      ? Math.ceil((options.unlockAt.getTime() - Date.now()) / 60000)
      : undefined;

    super(AuthErrorCodes.ACCOUNT_LOCKED, HttpStatus.UNAUTHORIZED, {
      context: options?.context,
      customMessage: remaining 
        ? `Account temporarily locked. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`
        : AuthErrorMessages[AuthErrorCodes.ACCOUNT_LOCKED],
    });

    this.unlockAt = options?.unlockAt;
    this.remainingMinutes = remaining;
  }
}

/** Account not verified error */
export class AccountNotVerifiedError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.ACCOUNT_NOT_VERIFIED, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Email already exists error */
export class EmailAlreadyExistsError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT, { context });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN ERRORS (401)
// ═══════════════════════════════════════════════════════════════════════════

/** Token missing error */
export class TokenMissingError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.TOKEN_MISSING, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Token invalid error */
export class TokenInvalidError extends AuthError {
  constructor(reason?: string, context?: ErrorContext) {
    super(AuthErrorCodes.TOKEN_INVALID, HttpStatus.UNAUTHORIZED, {
      context,
      customMessage: reason || AuthErrorMessages[AuthErrorCodes.TOKEN_INVALID],
    });
  }
}

/** Token expired error */
export class TokenExpiredError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Refresh token error */
export class RefreshTokenError extends AuthError {
  constructor(type: 'invalid' | 'expired', context?: ErrorContext) {
    const code = type === 'invalid' 
      ? AuthErrorCodes.REFRESH_TOKEN_INVALID 
      : AuthErrorCodes.REFRESH_TOKEN_EXPIRED;
    super(code, HttpStatus.UNAUTHORIZED, { context });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION ERRORS (401)
// ═══════════════════════════════════════════════════════════════════════════

/** Session expired error */
export class SessionExpiredError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.SESSION_EXPIRED, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Session not found error */
export class SessionNotFoundError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.SESSION_NOT_FOUND, HttpStatus.UNAUTHORIZED, { context });
  }
}

/** Too many sessions error */
export class TooManySessionsError extends AuthError {
  public readonly maxSessions: number;

  constructor(maxSessions = 5, context?: ErrorContext) {
    super(AuthErrorCodes.TOO_MANY_SESSIONS, HttpStatus.UNAUTHORIZED, {
      context,
      customMessage: `Maximum of ${maxSessions} active sessions allowed. Please log out from another device.`,
    });
    this.maxSessions = maxSessions;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MFA ERRORS (401)
// ═══════════════════════════════════════════════════════════════════════════

/** MFA required error */
export class MFARequiredError extends AuthError {
  public readonly mfaToken?: string;

  constructor(mfaToken?: string, context?: ErrorContext) {
    super(AuthErrorCodes.MFA_REQUIRED, HttpStatus.UNAUTHORIZED, { context });
    this.mfaToken = mfaToken;
  }

  getMfaResponse() {
    return {
      ...this.getAuthResponse(),
      mfaRequired: true,
      mfaToken: this.mfaToken,
    };
  }
}

/** MFA code invalid error */
export class MFACodeInvalidError extends AuthError {
  public readonly attemptsRemaining?: number;

  constructor(attemptsRemaining?: number, context?: ErrorContext) {
    super(AuthErrorCodes.MFA_CODE_INVALID, HttpStatus.UNAUTHORIZED, {
      context,
      customMessage: attemptsRemaining !== undefined
        ? `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
        : AuthErrorMessages[AuthErrorCodes.MFA_CODE_INVALID],
    });
    this.attemptsRemaining = attemptsRemaining;
  }
}

/** MFA code expired error */
export class MFACodeExpiredError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.MFA_CODE_EXPIRED, HttpStatus.UNAUTHORIZED, { context });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING ERRORS (429)
// ═══════════════════════════════════════════════════════════════════════════

/** Auth rate limit error */
export class AuthRateLimitError extends AuthError {
  public readonly retryAfter: number; // seconds
  public readonly limit: number;
  public readonly remaining: number;

  constructor(
    type: 'login' | 'register' | 'password_reset' | 'verification' | 'mfa',
    options: {
      retryAfter: number;
      limit?: number;
      remaining?: number;
      context?: ErrorContext;
    }
  ) {
    const codeMap = {
      login: AuthErrorCodes.RATE_LIMIT_LOGIN,
      register: AuthErrorCodes.RATE_LIMIT_REGISTER,
      password_reset: AuthErrorCodes.RATE_LIMIT_PASSWORD_RESET,
      verification: AuthErrorCodes.RATE_LIMIT_VERIFICATION,
      mfa: AuthErrorCodes.RATE_LIMIT_MFA,
    };

    const minutes = Math.ceil(options.retryAfter / 60);
    super(codeMap[type], HttpStatus.TOO_MANY_REQUESTS, {
      context: options.context,
      customMessage: `Too many attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`,
    });

    this.retryAfter = options.retryAfter;
    this.limit = options.limit || 0;
    this.remaining = options.remaining || 0;
  }

  getRateLimitResponse() {
    return {
      ...this.getAuthResponse(),
      retryAfter: this.retryAfter,
    };
  }

  getHeaders() {
    return {
      'Retry-After': String(this.retryAfter),
      'X-RateLimit-Limit': String(this.limit),
      'X-RateLimit-Remaining': String(this.remaining),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER ERRORS (500)
// ═══════════════════════════════════════════════════════════════════════════

/** Auth server error */
export class AuthServerError extends AuthError {
  constructor(
    type: 'general' | 'database' | 'email' | 'oauth' = 'general',
    cause?: Error,
    context?: ErrorContext
  ) {
    const codeMap = {
      general: AuthErrorCodes.SERVER_ERROR,
      database: AuthErrorCodes.DATABASE_ERROR,
      email: AuthErrorCodes.EMAIL_SERVICE_ERROR,
      oauth: AuthErrorCodes.OAUTH_SERVICE_ERROR,
    };

    super(codeMap[type], HttpStatus.INTERNAL_SERVER_ERROR, {
      context,
      cause,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD RESET ERRORS
// ═══════════════════════════════════════════════════════════════════════════

/** Reset token invalid error */
export class ResetTokenInvalidError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.RESET_TOKEN_INVALID, HttpStatus.BAD_REQUEST, { context });
  }
}

/** Reset token expired error */
export class ResetTokenExpiredError extends AuthError {
  constructor(context?: ErrorContext) {
    super(AuthErrorCodes.RESET_TOKEN_EXPIRED, HttpStatus.BAD_REQUEST, { context });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OAUTH ERRORS
// ═══════════════════════════════════════════════════════════════════════════

/** OAuth provider error */
export class OAuthProviderError extends AuthError {
  public readonly provider: string;

  constructor(provider: string, message?: string, context?: ErrorContext) {
    super(AuthErrorCodes.OAUTH_PROVIDER_ERROR, HttpStatus.BAD_REQUEST, {
      context: { ...context, provider },
      customMessage: message || `${provider} authentication failed. Please try again.`,
    });
    this.provider = provider;
  }
}

/** OAuth email not provided error */
export class OAuthEmailNotProvidedError extends AuthError {
  public readonly provider: string;

  constructor(provider: string, context?: ErrorContext) {
    super(AuthErrorCodes.OAUTH_EMAIL_NOT_PROVIDED, HttpStatus.BAD_REQUEST, {
      context: { ...context, provider },
      customMessage: `${provider} did not provide an email address. Please use a different sign-in method.`,
    });
    this.provider = provider;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export interface AuthValidationResult {
  valid: boolean;
  errors: Array<{ field: string; code: AuthErrorCode; message: string }>;
}

/** Validate email format */
export function validateEmail(email: unknown): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push({
      field: 'email',
      code: AuthErrorCodes.VALIDATION_EMAIL_REQUIRED,
      message: AuthErrorMessages[AuthErrorCodes.VALIDATION_EMAIL_REQUIRED],
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: 'email',
      code: AuthErrorCodes.VALIDATION_EMAIL_INVALID,
      message: AuthErrorMessages[AuthErrorCodes.VALIDATION_EMAIL_INVALID],
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Validate password strength */
export function validatePassword(
  password: unknown,
  options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  }
): AuthValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options || {};

  const errors: AuthValidationResult['errors'] = [];

  if (!password || typeof password !== 'string' || password === '') {
    errors.push({
      field: 'password',
      code: AuthErrorCodes.VALIDATION_PASSWORD_REQUIRED,
      message: AuthErrorMessages[AuthErrorCodes.VALIDATION_PASSWORD_REQUIRED],
    });
    return { valid: false, errors };
  }

  if (password.length < minLength) {
    errors.push({
      field: 'password',
      code: AuthErrorCodes.VALIDATION_PASSWORD_TOO_SHORT,
      message: `Password must be at least ${minLength} characters`,
    });
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const requirements: string[] = [];
  if (requireUppercase && !hasUppercase) requirements.push('uppercase letter');
  if (requireLowercase && !hasLowercase) requirements.push('lowercase letter');
  if (requireNumber && !hasNumber) requirements.push('number');
  if (requireSpecial && !hasSpecial) requirements.push('special character');

  if (requirements.length > 0) {
    errors.push({
      field: 'password',
      code: AuthErrorCodes.VALIDATION_PASSWORD_TOO_WEAK,
      message: `Password must contain: ${requirements.join(', ')}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Validate login credentials */
export function validateLoginCredentials(data: {
  email?: unknown;
  password?: unknown;
}): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = [];

  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password, {
    requireUppercase: false,
    requireLowercase: false,
    requireNumber: false,
  });

  return {
    valid: emailResult.valid && passwordResult.valid,
    errors: [...emailResult.errors, ...passwordResult.errors],
  };
}

/** Validate registration data */
export function validateRegistration(data: {
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  firstName?: unknown;
  lastName?: unknown;
}): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = [];

  // Email
  const emailResult = validateEmail(data.email);
  errors.push(...emailResult.errors);

  // Password
  const passwordResult = validatePassword(data.password);
  errors.push(...passwordResult.errors);

  // Confirm password
  if (data.password !== data.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      code: AuthErrorCodes.VALIDATION_PASSWORD_MISMATCH,
      message: AuthErrorMessages[AuthErrorCodes.VALIDATION_PASSWORD_MISMATCH],
    });
  }

  // Name
  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim() === '') {
    errors.push({
      field: 'firstName',
      code: AuthErrorCodes.VALIDATION_NAME_REQUIRED,
      message: 'First name is required',
    });
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim() === '') {
    errors.push({
      field: 'lastName',
      code: AuthErrorCodes.VALIDATION_NAME_REQUIRED,
      message: 'Last name is required',
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Assert validation passes or throw error */
export function assertAuthValid(
  result: AuthValidationResult,
  context?: ErrorContext
): void {
  if (!result.valid) {
    throw new AuthMultiValidationError(
      result.errors.map(e => ({ field: e.field, code: e.code })),
      context
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

/** Normalize Supabase auth errors */
export function normalizeSupabaseAuthError(
  error: { message?: string; status?: number; code?: string },
  context?: ErrorContext
): AuthError {
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  // Invalid credentials
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return new InvalidCredentialsError(context);
  }

  // Email not confirmed
  if (message.includes('email not confirmed') || code === 'email_not_confirmed') {
    return new AccountNotVerifiedError(context);
  }

  // User not found
  if (message.includes('user not found') || code === 'user_not_found') {
    return new InvalidCredentialsError(context);
  }

  // Email already registered
  if (message.includes('already registered') || code === 'user_already_exists') {
    return new EmailAlreadyExistsError(context);
  }

  // Invalid token
  if (message.includes('invalid token') || message.includes('jwt')) {
    return new TokenInvalidError(undefined, context);
  }

  // Token expired
  if (message.includes('token expired') || message.includes('session expired')) {
    return new TokenExpiredError(context);
  }

  // Rate limited
  if (message.includes('rate limit') || error.status === 429) {
    return new AuthRateLimitError('login', { retryAfter: 60, context });
  }

  // Default to server error
  logger.error('Unhandled Supabase auth error', new Error(error.message), context);
  return new AuthServerError('general', new Error(error.message), context);
}

/** Create auth error response */
export function createAuthErrorResponse(error: AuthError): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add rate limit headers
  if (error instanceof AuthRateLimitError) {
    Object.assign(headers, error.getHeaders());
  }

  return new Response(JSON.stringify(error.getAuthResponse()), {
    status: error.statusCode,
    headers,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  AuthErrorCodes,
  AuthErrorMessages,
  
  // Error classes
  AuthError,
  AuthValidationError,
  EmailValidationError,
  PasswordValidationError,
  AuthMultiValidationError,
  InvalidCredentialsError,
  EmailNotFoundError,
  WrongPasswordError,
  AccountDisabledError,
  AccountLockedError,
  AccountNotVerifiedError,
  EmailAlreadyExistsError,
  TokenMissingError,
  TokenInvalidError,
  TokenExpiredError,
  RefreshTokenError,
  SessionExpiredError,
  SessionNotFoundError,
  TooManySessionsError,
  MFARequiredError,
  MFACodeInvalidError,
  MFACodeExpiredError,
  AuthRateLimitError,
  AuthServerError,
  ResetTokenInvalidError,
  ResetTokenExpiredError,
  OAuthProviderError,
  OAuthEmailNotProvidedError,

  // Validation
  validateEmail,
  validatePassword,
  validateLoginCredentials,
  validateRegistration,
  assertAuthValid,

  // Utilities
  normalizeSupabaseAuthError,
  createAuthErrorResponse,
};
