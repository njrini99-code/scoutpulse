import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'CORS_ERROR'
  | 'AUTH_ERROR'
  | 'INTERNAL_ERROR';

interface MiddlewareError {
  type: ErrorType;
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  retryAfter?: number;
}

interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string | null;
  userAgent: string | null;
  duration?: number;
  status?: number;
  error?: MiddlewareError;
  userId?: string;
  sessionId?: string;
}

const ErrorCodes = {
  // Validation (1xxx)
  INVALID_CONTENT_TYPE: 'MW1001',
  INVALID_METHOD: 'MW1002',
  MISSING_REQUIRED_HEADER: 'MW1003',
  INVALID_REQUEST_SIZE: 'MW1004',
  MALFORMED_REQUEST: 'MW1005',
  INVALID_PATH: 'MW1006',
  
  // Rate Limiting (2xxx)
  RATE_LIMIT_EXCEEDED: 'MW2001',
  TOO_MANY_REQUESTS: 'MW2002',
  BURST_LIMIT_EXCEEDED: 'MW2003',
  
  // CORS (3xxx)
  CORS_ORIGIN_DENIED: 'MW3001',
  CORS_METHOD_NOT_ALLOWED: 'MW3002',
  CORS_HEADERS_NOT_ALLOWED: 'MW3003',
  CORS_PREFLIGHT_FAILED: 'MW3004',
  
  // Auth (4xxx)
  AUTH_REQUIRED: 'MW4001',
  AUTH_INVALID_TOKEN: 'MW4002',
  AUTH_EXPIRED_TOKEN: 'MW4003',
  AUTH_INSUFFICIENT_PERMISSIONS: 'MW4004',
  AUTH_SESSION_EXPIRED: 'MW4005',
  AUTH_INVALID_ROLE: 'MW4006',
  
  // Internal (9xxx)
  INTERNAL_ERROR: 'MW9001',
  SERVICE_UNAVAILABLE: 'MW9002',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  burstLimit?: number;    // Max burst requests
  skipPaths?: string[];   // Paths to skip rate limiting
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; burstCount: number }>();

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 100,        // 100 requests per minute
  burstLimit: 20,          // 20 requests burst
  skipPaths: [
    '/_next',
    '/favicon.ico',
    '/api/health',
  ],
};

// Path-specific rate limits (stricter for sensitive endpoints)
const pathRateLimits: Record<string, RateLimitConfig> = {
  '/api/auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // 10 attempts
    burstLimit: 5,
  },
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,            // Only 5 login attempts
    burstLimit: 3,
  },
  '/api/auth/signup': {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3,            // 3 signups per hour
    burstLimit: 2,
  },
  '/api/messages': {
    windowMs: 60 * 1000,
    maxRequests: 30,           // 30 messages per minute
    burstLimit: 10,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const corsConfig: CorsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Content-Language',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationConfig {
  maxBodySize: number;       // Max body size in bytes
  requiredHeaders?: string[];
  allowedContentTypes?: string[];
}

const validationConfig: ValidationConfig = {
  maxBodySize: 10 * 1024 * 1024, // 10MB
  allowedContentTypes: [
    'application/json',
    'multipart/form-data',
    'application/x-www-form-urlencoded',
    'text/plain',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getClientIP(request: NextRequest): string | null {
  // Check various headers for the client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return null;
}

function createLogEntry(request: NextRequest, requestId: string): RequestLogEntry {
  return {
    id: requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
  };
}

function logRequest(entry: RequestLogEntry): void {
  // In production, send to logging service (e.g., Datadog, CloudWatch)
  const logLevel = entry.error ? 'error' : entry.status && entry.status >= 400 ? 'warn' : 'info';
  
  const logData = {
    level: logLevel,
    ...entry,
    // Redact sensitive data
    userAgent: entry.userAgent?.substring(0, 100),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MW] ${logLevel.toUpperCase()} ${entry.method} ${entry.path}`, JSON.stringify(logData));
  } else {
    // Structured JSON logging for production
    console.log(JSON.stringify(logData));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR RESPONSE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function createErrorResponse(
  error: MiddlewareError,
  requestId: string,
  headers: Headers = new Headers()
): NextResponse {
  const body = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      type: error.type,
      ...(error.details && process.env.NODE_ENV === 'development' && { details: error.details }),
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  headers.set('Content-Type', 'application/json');
  headers.set('X-Request-ID', requestId);
  
  if (error.retryAfter) {
    headers.set('Retry-After', String(error.retryAfter));
  }
  
  return new NextResponse(JSON.stringify(body), {
    status: error.statusCode,
    headers,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function getRateLimitKey(request: NextRequest): string {
  const ip = getClientIP(request) || 'unknown';
  const path = request.nextUrl.pathname;
  return `${ip}:${path}`;
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Find path-specific config
  for (const [path, config] of Object.entries(pathRateLimits)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  return defaultRateLimitConfig;
}

function checkRateLimit(
  request: NextRequest,
  requestId: string
): { allowed: boolean; error?: MiddlewareError; headers?: Headers } {
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  
  // Skip rate limiting for configured paths
  if (config.skipPaths?.some(path => pathname.startsWith(path))) {
    return { allowed: true };
  }
  
  const key = getRateLimitKey(request);
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Clean up expired records periodically
  if (rateLimitStore.size > 10000) {
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((v, k) => {
      if (v.resetTime < now) {
        keysToDelete.push(k);
      }
    });
    keysToDelete.forEach(k => rateLimitStore.delete(k));
  }
  
  // Initialize or reset if window expired
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      burstCount: 1,
    });
    
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(config.maxRequests));
    headers.set('X-RateLimit-Remaining', String(config.maxRequests - 1));
    headers.set('X-RateLimit-Reset', String(Math.ceil((now + config.windowMs) / 1000)));
    
    return { allowed: true, headers };
  }
  
  // Check burst limit
  if (config.burstLimit && record.burstCount >= config.burstLimit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    return {
      allowed: false,
      error: {
        type: 'RATE_LIMIT_ERROR',
        code: ErrorCodes.BURST_LIMIT_EXCEEDED,
        message: 'Too many requests in a short period. Please slow down.',
        statusCode: 429,
        retryAfter,
        details: {
          limit: config.burstLimit,
          window: 'burst',
        },
      },
    };
  }
  
  // Check rate limit
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    return {
      allowed: false,
      error: {
        type: 'RATE_LIMIT_ERROR',
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
        retryAfter,
        details: {
          limit: config.maxRequests,
          windowMs: config.windowMs,
          resetAt: new Date(record.resetTime).toISOString(),
        },
      },
    };
  }
  
  // Increment counters
  record.count++;
  record.burstCount++;
  
  // Reset burst count after a short period
  setTimeout(() => {
    const current = rateLimitStore.get(key);
    if (current) {
      current.burstCount = Math.max(0, current.burstCount - 1);
    }
  }, 1000);
  
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(config.maxRequests));
  headers.set('X-RateLimit-Remaining', String(config.maxRequests - record.count));
  headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
  
  return { allowed: true, headers };
}

// ═══════════════════════════════════════════════════════════════════════════
// CORS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function handleCors(
  request: NextRequest,
  requestId: string
): { allowed: boolean; error?: MiddlewareError; headers?: Headers; isPreflight?: boolean } {
  const origin = request.headers.get('origin');
  const method = request.method;
  const headers = new Headers();
  
  // No origin header - not a CORS request
  if (!origin) {
    return { allowed: true };
  }
  
  // Check if origin is allowed
  const isAllowedOrigin = corsConfig.allowedOrigins.includes(origin) ||
    corsConfig.allowedOrigins.includes('*') ||
    (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));
  
  if (!isAllowedOrigin) {
    return {
      allowed: false,
      error: {
        type: 'CORS_ERROR',
        code: ErrorCodes.CORS_ORIGIN_DENIED,
        message: 'Origin not allowed by CORS policy.',
        statusCode: 403,
        details: {
          origin,
          allowedOrigins: process.env.NODE_ENV === 'development' ? corsConfig.allowedOrigins : undefined,
        },
      },
    };
  }
  
  // Set CORS headers
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', String(corsConfig.credentials));
  headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    const requestMethod = request.headers.get('access-control-request-method');
    const requestHeaders = request.headers.get('access-control-request-headers');
    
    // Check if method is allowed
    if (requestMethod && !corsConfig.allowedMethods.includes(requestMethod)) {
      return {
        allowed: false,
        isPreflight: true,
        error: {
          type: 'CORS_ERROR',
          code: ErrorCodes.CORS_METHOD_NOT_ALLOWED,
          message: `Method ${requestMethod} not allowed.`,
          statusCode: 405,
          details: {
            requestedMethod: requestMethod,
            allowedMethods: corsConfig.allowedMethods,
          },
        },
      };
    }
    
    // Check if headers are allowed
    if (requestHeaders) {
      const requestedHeaders = requestHeaders.split(',').map(h => h.trim().toLowerCase());
      const allowedHeaders = corsConfig.allowedHeaders.map(h => h.toLowerCase());
      const invalidHeaders = requestedHeaders.filter(h => !allowedHeaders.includes(h));
      
      if (invalidHeaders.length > 0) {
        return {
          allowed: false,
          isPreflight: true,
          error: {
            type: 'CORS_ERROR',
            code: ErrorCodes.CORS_HEADERS_NOT_ALLOWED,
            message: 'Some headers are not allowed by CORS policy.',
            statusCode: 403,
            details: {
              invalidHeaders,
              allowedHeaders: corsConfig.allowedHeaders,
            },
          },
        };
      }
    }
    
    headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
    headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    headers.set('Access-Control-Max-Age', String(corsConfig.maxAge));
    
    return { allowed: true, headers, isPreflight: true };
  }
  
  // Check if actual request method is allowed
  if (!corsConfig.allowedMethods.includes(method)) {
    return {
      allowed: false,
      error: {
        type: 'CORS_ERROR',
        code: ErrorCodes.CORS_METHOD_NOT_ALLOWED,
        message: `Method ${method} not allowed.`,
        statusCode: 405,
      },
    };
  }
  
  return { allowed: true, headers };
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function validateRequest(
  request: NextRequest,
  requestId: string
): { valid: boolean; error?: MiddlewareError } {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // Skip validation for static files and GET/HEAD requests
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    method === 'GET' ||
    method === 'HEAD' ||
    method === 'OPTIONS'
  ) {
    return { valid: true };
  }
  
  // Validate Content-Type for requests with body
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = request.headers.get('content-type');
    
    if (contentType) {
      const baseContentType = contentType.split(';')[0].trim().toLowerCase();
      
      if (validationConfig.allowedContentTypes &&
          !validationConfig.allowedContentTypes.some(allowed => baseContentType.startsWith(allowed))) {
        return {
          valid: false,
          error: {
            type: 'VALIDATION_ERROR',
            code: ErrorCodes.INVALID_CONTENT_TYPE,
            message: 'Invalid or unsupported Content-Type.',
            statusCode: 415,
            details: {
              received: baseContentType,
              allowed: validationConfig.allowedContentTypes,
            },
          },
        };
      }
    }
  }
  
  // Validate Content-Length
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > validationConfig.maxBodySize) {
      return {
        valid: false,
        error: {
          type: 'VALIDATION_ERROR',
          code: ErrorCodes.INVALID_REQUEST_SIZE,
          message: 'Request body too large.',
          statusCode: 413,
          details: {
            maxSize: validationConfig.maxBodySize,
            receivedSize: size,
          },
        },
      };
    }
  }
  
  // Validate path for potential path traversal
  if (pathname.includes('..') || pathname.includes('//')) {
    return {
      valid: false,
      error: {
        type: 'VALIDATION_ERROR',
        code: ErrorCodes.INVALID_PATH,
        message: 'Invalid request path.',
        statusCode: 400,
      },
    };
  }
  
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ERROR HANDLING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function createAuthError(
  type: 'required' | 'invalid_token' | 'expired' | 'insufficient_permissions' | 'invalid_role',
  details?: Record<string, unknown>
): MiddlewareError {
  const errors: Record<string, MiddlewareError> = {
    required: {
      type: 'AUTH_ERROR',
      code: ErrorCodes.AUTH_REQUIRED,
      message: 'Authentication required. Please log in.',
      statusCode: 401,
      details,
    },
    invalid_token: {
      type: 'AUTH_ERROR',
      code: ErrorCodes.AUTH_INVALID_TOKEN,
      message: 'Invalid authentication token.',
      statusCode: 401,
      details,
    },
    expired: {
      type: 'AUTH_ERROR',
      code: ErrorCodes.AUTH_EXPIRED_TOKEN,
      message: 'Your session has expired. Please log in again.',
      statusCode: 401,
      details,
    },
    insufficient_permissions: {
      type: 'AUTH_ERROR',
      code: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
      message: 'You do not have permission to access this resource.',
      statusCode: 403,
      details,
    },
    invalid_role: {
      type: 'AUTH_ERROR',
      code: ErrorCodes.AUTH_INVALID_ROLE,
      message: 'Your role does not allow access to this resource.',
      statusCode: 403,
      details,
    },
  };
  
  return errors[type];
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

type UserRole = 'player' | 'coach' | 'admin';
type CoachType = 'college' | 'high_school' | 'juco' | 'showcase';

interface RouteConfig {
  allowedRoles: UserRole[];
  allowedCoachTypes?: CoachType[];
  redirectTo?: string;
}

// Define protected routes and their allowed roles
const PROTECTED_ROUTES: Record<string, RouteConfig> = {
  // ═══════════════════════════════════════════════════════════════════════
  // HIGH SCHOOL COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  '/hs-coach/dashboard': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    redirectTo: '/coach/high-school',
  },
  '/hs-coach/roster': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    redirectTo: '/coach/high-school/roster',
  },
  '/coach/high-school': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
  },
  '/coach/high-school/roster': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
  },
  '/coach/high-school/team': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
  },
  '/coach/high-school/messages': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JUCO COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  '/juco/dashboard': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    redirectTo: '/coach/juco',
  },
  '/juco/portal': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    redirectTo: '/coach/juco/transfer-portal',
  },
  '/coach/juco': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
  },
  '/coach/juco/transfer-portal': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
  },
  '/coach/juco/team': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
  },
  '/coach/juco/messages': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COLLEGE COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  '/coach/college': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/discover': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/watchlist': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/recruiting-planner': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/calendar': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/camps': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },
  '/coach/college/messages': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SHOWCASE COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  '/coach/showcase': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
  },
  '/coach/showcase/team': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
  },
  '/coach/showcase/messages': {
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ANY COACH ROUTES (all coach types allowed)
  // ═══════════════════════════════════════════════════════════════════════
  '/coach/player': {
    allowedRoles: ['coach'],
    // No allowedCoachTypes means all coach types can access
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PLAYER ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  '/player': {
    allowedRoles: ['player'],
  },
  '/player/journey': {
    allowedRoles: ['player'],
    redirectTo: '/player/dashboard/recruiting',
  },
  '/player/dashboard': {
    allowedRoles: ['player'],
  },
  '/player/dashboard/recruiting': {
    allowedRoles: ['player'],
  },
  '/player/dashboard/performance': {
    allowedRoles: ['player'],
  },
  '/player/dashboard/events': {
    allowedRoles: ['player'],
  },
  '/player/dashboard/programs': {
    allowedRoles: ['player'],
  },
  '/player/dashboard/settings': {
    allowedRoles: ['player'],
  },
  '/player/discover': {
    allowedRoles: ['player'],
  },
  '/player/team': {
    allowedRoles: ['player'],
  },
  '/player/messages': {
    allowedRoles: ['player'],
  },
  '/player/profile': {
    allowedRoles: ['player'],
  },
  '/player/camps': {
    allowedRoles: ['player'],
  },
  '/player/notifications': {
    allowedRoles: ['player'],
  },
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/onboarding/coach',
  '/onboarding/player',
  '/test-db',
  '/test-d1-badges',
  '/api',
];

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const { pathname } = request.nextUrl;
  const logEntry = createLogEntry(request, requestId);
  
  // Initialize response headers collector
  const responseHeaders = new Headers();
  responseHeaders.set('X-Request-ID', requestId);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Request Validation
    // ═══════════════════════════════════════════════════════════════════════
    const validationResult = validateRequest(request, requestId);
    if (!validationResult.valid && validationResult.error) {
      logEntry.status = validationResult.error.statusCode;
      logEntry.error = validationResult.error;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      return createErrorResponse(validationResult.error, requestId, responseHeaders);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: CORS Handling
    // ═══════════════════════════════════════════════════════════════════════
    const corsResult = handleCors(request, requestId);
    
    // Merge CORS headers
    if (corsResult.headers) {
      corsResult.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
    }
    
    // Handle CORS errors
    if (!corsResult.allowed && corsResult.error) {
      logEntry.status = corsResult.error.statusCode;
      logEntry.error = corsResult.error;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      return createErrorResponse(corsResult.error, requestId, responseHeaders);
    }
    
    // Handle preflight requests
    if (corsResult.isPreflight) {
      logEntry.status = 204;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Rate Limiting
    // ═══════════════════════════════════════════════════════════════════════
    const rateLimitResult = checkRateLimit(request, requestId);
    
    // Merge rate limit headers
    if (rateLimitResult.headers) {
      rateLimitResult.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
    }
    
    // Handle rate limit exceeded
    if (!rateLimitResult.allowed && rateLimitResult.error) {
      logEntry.status = rateLimitResult.error.statusCode;
      logEntry.error = rateLimitResult.error;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      return createErrorResponse(rateLimitResult.error, requestId, responseHeaders);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Skip Public Routes and Static Files
    // ═══════════════════════════════════════════════════════════════════════
    
    // Skip public routes
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
      logEntry.status = 200;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      
      const response = NextResponse.next();
      responseHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Skip static files and internal Next.js routes
    if (
      pathname.startsWith('/_next') ||
      pathname.includes('.') // static files
    ) {
      return NextResponse.next();
    }

    // For API routes, still apply all middleware checks but don't require session
    if (pathname.startsWith('/api/')) {
      logEntry.status = 200;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      
      const response = NextResponse.next();
      responseHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Dev Mode Bypass
    // ═══════════════════════════════════════════════════════════════════════
    
    // Check for dev mode cookie
    const devModeCookie = request.cookies.get('dev_mode');
    
    if (devModeCookie?.value === 'true') {
      // In dev mode, handle alias routes with redirects
      const matchedRoute = findMatchingRoute(pathname);
      if (matchedRoute?.redirectTo) {
        logEntry.status = 302;
        logEntry.duration = Date.now() - startTime;
        logRequest(logEntry);
        return NextResponse.redirect(new URL(matchedRoute.redirectTo, request.url));
      }
      
      logEntry.status = 200;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      
      const response = NextResponse.next();
      responseHeaders.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: Authentication & Authorization
    // ═══════════════════════════════════════════════════════════════════════

    // Create Supabase client for auth check
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Handle session errors
    if (sessionError) {
      const errorDetails = {
        errorMessage: sessionError.message,
        errorName: sessionError.name,
      };
      
      // Check if it's a token expiration error
      if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
        const authError = createAuthError('expired', errorDetails);
        logEntry.status = authError.statusCode;
        logEntry.error = authError;
        logEntry.duration = Date.now() - startTime;
        logRequest(logEntry);
        
        // For page routes, redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('error', 'session_expired');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Find matching route configuration
    const matchedRoute = findMatchingRoute(pathname);

    // Handle alias routes with redirects (even without auth)
    if (matchedRoute?.redirectTo) {
      logEntry.status = 302;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      return NextResponse.redirect(new URL(matchedRoute.redirectTo, request.url));
    }

    // If no session and trying to access protected route, redirect to login
    if (!session && matchedRoute) {
      logEntry.status = 302;
      logEntry.duration = Date.now() - startTime;
      logRequest(logEntry);
      
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If session exists but route requires role validation
    if (session && matchedRoute) {
      logEntry.userId = session.user.id;
      logEntry.sessionId = session.access_token?.substring(0, 8);
      
      // Get user profile for role check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        const authError = createAuthError('insufficient_permissions', {
          reason: 'Failed to fetch user profile',
          error: profileError.message,
        });
        logEntry.status = authError.statusCode;
        logEntry.error = authError;
        logEntry.duration = Date.now() - startTime;
        logRequest(logEntry);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      const userRole = profile?.role as UserRole | undefined;

      if (!userRole || !matchedRoute.allowedRoles.includes(userRole)) {
        // User doesn't have the required role
        const authError = createAuthError('invalid_role', {
          requiredRoles: matchedRoute.allowedRoles,
          userRole: userRole || 'none',
        });
        logEntry.status = authError.statusCode;
        logEntry.error = authError;
        logEntry.duration = Date.now() - startTime;
        logRequest(logEntry);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Additional coach type validation
      if (userRole === 'coach' && matchedRoute.allowedCoachTypes) {
        const { data: coach, error: coachError } = await supabase
          .from('coaches')
          .select('coach_type')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (coachError) {
          const authError = createAuthError('insufficient_permissions', {
            reason: 'Failed to fetch coach profile',
            error: coachError.message,
          });
          logEntry.status = authError.statusCode;
          logEntry.error = authError;
          logEntry.duration = Date.now() - startTime;
          logRequest(logEntry);
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const coachType = normalizeCoachType(coach?.coach_type);
        
        if (!coachType || !matchedRoute.allowedCoachTypes.includes(coachType)) {
          // Coach doesn't have the required coach type, redirect to their dashboard
          const authError = createAuthError('invalid_role', {
            requiredCoachTypes: matchedRoute.allowedCoachTypes,
            coachType: coachType || 'none',
          });
          logEntry.status = 302;
          logEntry.error = authError;
          logEntry.duration = Date.now() - startTime;
          logRequest(logEntry);
          
          const redirectPath = getCoachDashboard(coachType);
          return NextResponse.redirect(new URL(redirectPath, request.url));
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Success Response
    // ═══════════════════════════════════════════════════════════════════════
    
    logEntry.status = 200;
    logEntry.duration = Date.now() - startTime;
    logRequest(logEntry);
    
    // Add response headers
    responseHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL ERROR HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    
    const internalError: MiddlewareError = {
      type: 'INTERNAL_ERROR',
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      } : undefined,
    };
    
    logEntry.status = 500;
    logEntry.error = internalError;
    logEntry.duration = Date.now() - startTime;
    logRequest(logEntry);
    
    // For page routes, show error page
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL(`/error?code=500&requestId=${requestId}`, request.url));
    }
    
    return createErrorResponse(internalError, requestId, responseHeaders);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function findMatchingRoute(pathname: string): RouteConfig | null {
  // Exact match first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname];
  }

  // Check for dynamic routes (e.g., /coach/player/[id])
  for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
    // Handle dynamic segments
    if (pathname.startsWith(route + '/')) {
      return config;
    }
  }

  return null;
}

function normalizeCoachType(type: string | null | undefined): CoachType | null {
  if (!type) return null;
  const normalized = type.toLowerCase().replace('-', '_');
  if (['college', 'high_school', 'juco', 'showcase'].includes(normalized)) {
    return normalized as CoachType;
  }
  return null;
}

function getCoachDashboard(coachType: CoachType | null): string {
  switch (coachType) {
    case 'high_school':
      return '/coach/high-school';
    case 'juco':
      return '/coach/juco';
    case 'showcase':
      return '/coach/showcase';
    case 'college':
    default:
      return '/coach/college';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
