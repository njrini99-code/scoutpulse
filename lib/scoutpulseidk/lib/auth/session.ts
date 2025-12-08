/**
 * Session Validation & Token Refresh System
 * 
 * Provides:
 * - Session validation with proper error types
 * - Token refresh logic with retry mechanism
 * - Authentication error handling for expired/invalid tokens
 * - Graceful degradation for auth failures
 */

import {
  AuthError,
  AuthErrorCodes,
  TokenExpiredError,
  TokenInvalidError,
  TokenMissingError,
  SessionExpiredError,
  SessionNotFoundError,
  RefreshTokenError,
  AuthServerError,
  AuthRateLimitError,
  createAuthErrorResponse,
} from './errors';
import { logger, type ErrorContext } from '@/lib/errors';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  metadata?: Record<string, unknown>;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  jti?: string; // token id
}

export interface SessionValidationResult {
  valid: boolean;
  session?: Session;
  user?: User;
  error?: AuthError;
  shouldRefresh?: boolean;
  isExpired?: boolean;
}

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: AuthError;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface SessionConfig {
  /** Access token TTL in seconds (default: 15 minutes) */
  accessTokenTTL: number;
  /** Refresh token TTL in seconds (default: 7 days) */
  refreshTokenTTL: number;
  /** Time before expiry to trigger refresh (default: 5 minutes) */
  refreshThreshold: number;
  /** Maximum retry attempts for token refresh (default: 3) */
  maxRefreshRetries: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay: number;
  /** Enable automatic token refresh (default: true) */
  autoRefresh: boolean;
  /** Session inactivity timeout in seconds (default: 30 minutes) */
  inactivityTimeout: number;
}

export const defaultSessionConfig: SessionConfig = {
  accessTokenTTL: 15 * 60, // 15 minutes
  refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
  refreshThreshold: 5 * 60, // 5 minutes before expiry
  maxRefreshRetries: 3,
  retryDelay: 1000,
  autoRefresh: true,
  inactivityTimeout: 30 * 60, // 30 minutes
};

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Decode JWT token without verification (for client-side use) */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/** Check if token is expired */
export function isTokenExpired(token: string, bufferSeconds = 0): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  
  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now() + bufferSeconds * 1000;
  
  return now >= expiresAt;
}

/** Get time until token expires in seconds */
export function getTokenTTL(token: string): number {
  const payload = decodeToken(token);
  if (!payload?.exp) return 0;
  
  const expiresAt = payload.exp * 1000;
  const ttl = Math.floor((expiresAt - Date.now()) / 1000);
  
  return Math.max(0, ttl);
}

/** Check if token should be refreshed */
export function shouldRefreshToken(token: string, threshold: number): boolean {
  const ttl = getTokenTTL(token);
  return ttl > 0 && ttl <= threshold;
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export interface SessionValidator {
  validateSession(sessionId: string): Promise<SessionValidationResult>;
  validateToken(token: string): Promise<SessionValidationResult>;
  getSession(sessionId: string): Promise<Session | null>;
  getUser(userId: string): Promise<User | null>;
}

/** Validate session and return proper error types */
export async function validateSession(
  token: string | null | undefined,
  validator: SessionValidator,
  config: SessionConfig = defaultSessionConfig,
  context?: ErrorContext
): Promise<SessionValidationResult> {
  // No token provided
  if (!token) {
    return {
      valid: false,
      error: new TokenMissingError(context),
    };
  }

  // Check token format
  const payload = decodeToken(token);
  if (!payload) {
    return {
      valid: false,
      error: new TokenInvalidError('Malformed token', context),
    };
  }

  // Check if expired
  if (isTokenExpired(token)) {
    return {
      valid: false,
      isExpired: true,
      error: new TokenExpiredError(context),
    };
  }

  // Check if should refresh soon
  const shouldRefresh = shouldRefreshToken(token, config.refreshThreshold);

  try {
    // Validate with backend
    const result = await validator.validateToken(token);
    
    if (!result.valid) {
      return result;
    }

    return {
      valid: true,
      session: result.session,
      user: result.user,
      shouldRefresh,
    };
  } catch (error) {
    logger.error('Session validation failed', error as Error, context);
    
    return {
      valid: false,
      error: new AuthServerError('general', error as Error, context),
    };
  }
}

/** Validate session by ID */
export async function validateSessionById(
  sessionId: string | null | undefined,
  validator: SessionValidator,
  config: SessionConfig = defaultSessionConfig,
  context?: ErrorContext
): Promise<SessionValidationResult> {
  if (!sessionId) {
    return {
      valid: false,
      error: new SessionNotFoundError(context),
    };
  }

  try {
    const session = await validator.getSession(sessionId);
    
    if (!session) {
      return {
        valid: false,
        error: new SessionNotFoundError(context),
      };
    }

    // Check if session expired
    if (new Date() >= session.expiresAt) {
      return {
        valid: false,
        isExpired: true,
        error: new SessionExpiredError(context),
      };
    }

    // Check inactivity timeout
    const inactiveMs = Date.now() - session.lastActivityAt.getTime();
    if (inactiveMs > config.inactivityTimeout * 1000) {
      return {
        valid: false,
        isExpired: true,
        error: new SessionExpiredError(context),
      };
    }

    // Get user
    const user = await validator.getUser(session.userId);
    if (!user) {
      return {
        valid: false,
        error: new SessionNotFoundError(context),
      };
    }

    // Check if should refresh
    const ttl = (session.expiresAt.getTime() - Date.now()) / 1000;
    const shouldRefresh = ttl <= config.refreshThreshold;

    return {
      valid: true,
      session,
      user,
      shouldRefresh,
    };
  } catch (error) {
    logger.error('Session validation by ID failed', error as Error, context);
    
    return {
      valid: false,
      error: new AuthServerError('general', error as Error, context),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN REFRESH WITH RETRY
// ═══════════════════════════════════════════════════════════════════════════

export interface TokenRefresher {
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>;
}

/** Sleep utility for retry delays */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Calculate exponential backoff delay */
function getBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
}

/** Refresh token with retry mechanism */
export async function refreshTokenWithRetry(
  refreshToken: string,
  refresher: TokenRefresher,
  config: SessionConfig = defaultSessionConfig,
  context?: ErrorContext
): Promise<TokenRefreshResult> {
  let lastError: AuthError | undefined;
  
  for (let attempt = 1; attempt <= config.maxRefreshRetries; attempt++) {
    try {
      logger.debug(`Token refresh attempt ${attempt}/${config.maxRefreshRetries}`, context);
      
      const result = await refresher.refreshToken(refreshToken);
      
      if (result.success) {
        logger.info('Token refresh successful', context);
        return result;
      }
      
      // Check if error is retryable
      if (result.error) {
        lastError = result.error;
        
        // Don't retry on these errors
        if (
          result.error instanceof RefreshTokenError ||
          result.error instanceof TokenInvalidError ||
          result.error.authCode === AuthErrorCodes.REFRESH_TOKEN_EXPIRED ||
          result.error.authCode === AuthErrorCodes.REFRESH_TOKEN_INVALID
        ) {
          logger.warn('Token refresh failed with non-retryable error', result.error, context);
          return result;
        }
        
        // Don't retry on rate limit
        if (result.error instanceof AuthRateLimitError) {
          logger.warn('Token refresh rate limited', result.error, context);
          return result;
        }
      }
      
      // Wait before retry with exponential backoff
      if (attempt < config.maxRefreshRetries) {
        const delay = getBackoffDelay(attempt, config.retryDelay);
        logger.debug(`Waiting ${delay}ms before retry`, context);
        await sleep(delay);
      }
    } catch (error) {
      lastError = error instanceof AuthError 
        ? error 
        : new AuthServerError('general', error as Error, context);
      
      logger.warn(`Token refresh attempt ${attempt} failed`, error as Error, context);
      
      // Wait before retry
      if (attempt < config.maxRefreshRetries) {
        const delay = getBackoffDelay(attempt, config.retryDelay);
        await sleep(delay);
      }
    }
  }
  
  logger.error('Token refresh failed after all retries', lastError, context);
  
  return {
    success: false,
    error: lastError || new RefreshTokenError('invalid', context),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export type AuthErrorHandler = (error: AuthError) => void | Promise<void>;

export interface AuthErrorHandlers {
  onTokenExpired?: AuthErrorHandler;
  onTokenInvalid?: AuthErrorHandler;
  onSessionExpired?: AuthErrorHandler;
  onRefreshFailed?: AuthErrorHandler;
  onUnauthorized?: AuthErrorHandler;
  onRateLimited?: AuthErrorHandler;
  onServerError?: AuthErrorHandler;
}

/** Handle authentication errors with appropriate callbacks */
export async function handleAuthError(
  error: AuthError,
  handlers: AuthErrorHandlers,
  context?: ErrorContext
): Promise<void> {
  logger.warn('Handling auth error', error, context);

  try {
    // Token expired
    if (error instanceof TokenExpiredError || error.authCode === AuthErrorCodes.TOKEN_EXPIRED) {
      await handlers.onTokenExpired?.(error);
      return;
    }

    // Token invalid
    if (error instanceof TokenInvalidError || error.authCode === AuthErrorCodes.TOKEN_INVALID) {
      await handlers.onTokenInvalid?.(error);
      return;
    }

    // Session expired
    if (error instanceof SessionExpiredError || error.authCode === AuthErrorCodes.SESSION_EXPIRED) {
      await handlers.onSessionExpired?.(error);
      return;
    }

    // Refresh failed
    if (
      error instanceof RefreshTokenError ||
      error.authCode === AuthErrorCodes.REFRESH_TOKEN_INVALID ||
      error.authCode === AuthErrorCodes.REFRESH_TOKEN_EXPIRED
    ) {
      await handlers.onRefreshFailed?.(error);
      return;
    }

    // Rate limited
    if (error instanceof AuthRateLimitError) {
      await handlers.onRateLimited?.(error);
      return;
    }

    // Server error
    if (error instanceof AuthServerError) {
      await handlers.onServerError?.(error);
      return;
    }

    // Generic unauthorized
    await handlers.onUnauthorized?.(error);
  } catch (handlerError) {
    logger.error('Auth error handler failed', handlerError as Error, context);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL DEGRADATION
// ═══════════════════════════════════════════════════════════════════════════

export interface GracefulAuthOptions {
  /** Allow anonymous access when auth fails */
  allowAnonymous?: boolean;
  /** Return cached user data when refresh fails */
  useCachedUser?: boolean;
  /** Retry refresh on navigation */
  retryOnNavigation?: boolean;
  /** Show auth error banner instead of redirect */
  showErrorBanner?: boolean;
  /** Maximum time to use cached data (seconds) */
  cacheMaxAge?: number;
}

export interface GracefulAuthResult {
  authenticated: boolean;
  user: User | null;
  session: Session | null;
  degraded: boolean;
  error: AuthError | null;
  actions: {
    shouldRedirectToLogin: boolean;
    shouldShowBanner: boolean;
    shouldRetryRefresh: boolean;
    canAccessContent: boolean;
  };
}

/** Handle auth with graceful degradation */
export async function gracefulAuth(
  token: string | null | undefined,
  refreshToken: string | null | undefined,
  validator: SessionValidator,
  refresher: TokenRefresher,
  options: GracefulAuthOptions = {},
  config: SessionConfig = defaultSessionConfig,
  context?: ErrorContext
): Promise<GracefulAuthResult> {
  const {
    allowAnonymous = false,
    useCachedUser = true,
    retryOnNavigation = true,
    showErrorBanner = true,
    cacheMaxAge = 300, // 5 minutes
  } = options;

  // Default result for anonymous access
  const anonymousResult: GracefulAuthResult = {
    authenticated: false,
    user: null,
    session: null,
    degraded: false,
    error: null,
    actions: {
      shouldRedirectToLogin: !allowAnonymous,
      shouldShowBanner: false,
      shouldRetryRefresh: false,
      canAccessContent: allowAnonymous,
    },
  };

  // No token at all
  if (!token) {
    logger.debug('No token provided', context);
    return {
      ...anonymousResult,
      error: new TokenMissingError(context),
    };
  }

  // Validate current token
  const validation = await validateSession(token, validator, config, context);

  // Token is valid
  if (validation.valid && validation.user && validation.session) {
    return {
      authenticated: true,
      user: validation.user,
      session: validation.session,
      degraded: false,
      error: null,
      actions: {
        shouldRedirectToLogin: false,
        shouldShowBanner: false,
        shouldRetryRefresh: validation.shouldRefresh || false,
        canAccessContent: true,
      },
    };
  }

  // Token expired but we have refresh token
  if (validation.isExpired && refreshToken) {
    logger.debug('Token expired, attempting refresh', context);
    
    const refreshResult = await refreshTokenWithRetry(
      refreshToken,
      refresher,
      config,
      context
    );

    if (refreshResult.success && refreshResult.accessToken) {
      // Re-validate with new token
      const newValidation = await validateSession(
        refreshResult.accessToken,
        validator,
        config,
        context
      );

      if (newValidation.valid && newValidation.user) {
        return {
          authenticated: true,
          user: newValidation.user,
          session: newValidation.session || null,
          degraded: false,
          error: null,
          actions: {
            shouldRedirectToLogin: false,
            shouldShowBanner: false,
            shouldRetryRefresh: false,
            canAccessContent: true,
          },
        };
      }
    }

    // Refresh failed - check for graceful degradation options
    if (useCachedUser) {
      const cachedUser = getCachedUser();
      if (cachedUser && isCacheValid(cachedUser.cachedAt, cacheMaxAge)) {
        logger.info('Using cached user data after refresh failure', context);
        
        return {
          authenticated: false,
          user: cachedUser.user,
          session: null,
          degraded: true,
          error: refreshResult.error || validation.error || null,
          actions: {
            shouldRedirectToLogin: false,
            shouldShowBanner: showErrorBanner,
            shouldRetryRefresh: retryOnNavigation,
            canAccessContent: true,
          },
        };
      }
    }

    // No cached data - return error state
    return {
      authenticated: false,
      user: null,
      session: null,
      degraded: false,
      error: refreshResult.error || validation.error || null,
      actions: {
        shouldRedirectToLogin: !allowAnonymous,
        shouldShowBanner: showErrorBanner && allowAnonymous,
        shouldRetryRefresh: retryOnNavigation,
        canAccessContent: allowAnonymous,
      },
    };
  }

  // Token invalid or other error
  return {
    ...anonymousResult,
    error: validation.error || null,
    actions: {
      shouldRedirectToLogin: !allowAnonymous,
      shouldShowBanner: showErrorBanner && allowAnonymous,
      shouldRetryRefresh: false,
      canAccessContent: allowAnonymous,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface CachedUser {
  user: User;
  cachedAt: number;
}

const CACHE_KEY = 'auth_cached_user';

/** Get cached user from storage */
function getCachedUser(): CachedUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as CachedUser;
  } catch {
    return null;
  }
}

/** Cache user data */
export function cacheUser(user: User): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached: CachedUser = {
      user,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/** Clear cached user */
export function clearCachedUser(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/** Check if cache is still valid */
function isCacheValid(cachedAt: number, maxAgeSeconds: number): boolean {
  const age = (Date.now() - cachedAt) / 1000;
  return age < maxAgeSeconds;
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class SessionManager {
  private config: SessionConfig;
  private validator: SessionValidator;
  private refresher: TokenRefresher;
  private errorHandlers: AuthErrorHandlers;
  private refreshTimer: NodeJS.Timeout | null = null;
  private currentSession: Session | null = null;
  private currentUser: User | null = null;

  constructor(
    validator: SessionValidator,
    refresher: TokenRefresher,
    config: Partial<SessionConfig> = {},
    errorHandlers: AuthErrorHandlers = {}
  ) {
    this.validator = validator;
    this.refresher = refresher;
    this.config = { ...defaultSessionConfig, ...config };
    this.errorHandlers = errorHandlers;
  }

  /** Get current auth state */
  getState(): AuthState {
    return {
      isAuthenticated: !!this.currentSession,
      isLoading: false,
      user: this.currentUser,
      session: this.currentSession,
      error: null,
    };
  }

  /** Initialize session from token */
  async initialize(
    accessToken: string | null,
    refreshToken: string | null,
    context?: ErrorContext
  ): Promise<GracefulAuthResult> {
    const result = await gracefulAuth(
      accessToken,
      refreshToken,
      this.validator,
      this.refresher,
      { useCachedUser: true },
      this.config,
      context
    );

    if (result.authenticated && result.user) {
      this.currentUser = result.user;
      this.currentSession = result.session;
      cacheUser(result.user);
      
      // Start auto-refresh if enabled
      if (this.config.autoRefresh && result.session) {
        this.scheduleRefresh(result.session.expiresAt);
      }
    } else if (result.degraded && result.user) {
      this.currentUser = result.user;
      this.currentSession = null;
    } else {
      this.currentUser = null;
      this.currentSession = null;
      clearCachedUser();
    }

    return result;
  }

  /** Refresh the current session */
  async refresh(refreshToken: string, context?: ErrorContext): Promise<TokenRefreshResult> {
    const result = await refreshTokenWithRetry(
      refreshToken,
      this.refresher,
      this.config,
      context
    );

    if (!result.success && result.error) {
      await handleAuthError(result.error, this.errorHandlers, context);
    }

    return result;
  }

  /** Validate current session */
  async validate(token: string, context?: ErrorContext): Promise<SessionValidationResult> {
    const result = await validateSession(token, this.validator, this.config, context);

    if (!result.valid && result.error) {
      await handleAuthError(result.error, this.errorHandlers, context);
    }

    return result;
  }

  /** Schedule automatic token refresh */
  private scheduleRefresh(expiresAt: Date): void {
    this.cancelRefresh();

    const ttl = expiresAt.getTime() - Date.now();
    const refreshIn = Math.max(0, ttl - this.config.refreshThreshold * 1000);

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(() => {
        this.triggerRefresh();
      }, refreshIn);
    }
  }

  /** Cancel scheduled refresh */
  private cancelRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /** Trigger refresh (to be overridden with actual implementation) */
  private triggerRefresh(): void {
    logger.debug('Auto-refresh triggered');
    // This should be connected to actual refresh logic
    // via event emitter or callback
  }

  /** Clear session and logout */
  logout(): void {
    this.cancelRefresh();
    this.currentSession = null;
    this.currentUser = null;
    clearCachedUser();
  }

  /** Destroy manager */
  destroy(): void {
    this.cancelRefresh();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Extract token from Authorization header */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/** Extract token from cookie */
export function extractCookieToken(request: Request, cookieName = 'access_token'): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[cookieName] || null;
}

/** Create middleware for session validation */
export function createSessionMiddleware(
  validator: SessionValidator,
  config: Partial<SessionConfig> = {}
) {
  const fullConfig = { ...defaultSessionConfig, ...config };

  return async (request: Request): Promise<SessionValidationResult> => {
    const token = extractBearerToken(request) || extractCookieToken(request);

    return validateSession(token, validator, fullConfig, {
      path: new URL(request.url).pathname,
      method: request.method,
    });
  };
}

/** Require valid session or return error response */
export async function requireSession(
  request: Request,
  validator: SessionValidator,
  config: Partial<SessionConfig> = {}
): Promise<{ session: Session; user: User } | Response> {
  const token = extractBearerToken(request) || extractCookieToken(request);
  const result = await validateSession(
    token,
    validator,
    { ...defaultSessionConfig, ...config },
    {
      path: new URL(request.url).pathname,
      method: request.method,
    }
  );

  if (!result.valid || !result.session || !result.user) {
    return createAuthErrorResponse(
      result.error || new TokenMissingError()
    );
  }

  return { session: result.session, user: result.user };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Config
  defaultSessionConfig,

  // Token utilities
  decodeToken,
  isTokenExpired,
  getTokenTTL,
  shouldRefreshToken,

  // Validation
  validateSession,
  validateSessionById,

  // Refresh
  refreshTokenWithRetry,

  // Error handling
  handleAuthError,

  // Graceful degradation
  gracefulAuth,

  // Cache
  cacheUser,
  clearCachedUser,

  // Session Manager
  SessionManager,

  // Middleware
  extractBearerToken,
  extractCookieToken,
  createSessionMiddleware,
  requireSession,
};
