/**
 * Error Handling Examples
 * 
 * This file demonstrates how to use the error handling system
 * in different scenarios across the application.
 */

import {
  // Error classes
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  InternalError,

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

  // Types
  type ValidationSchema,
  type ErrorContext,
} from './index';

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: API Route Handler with Full Error Handling
// ═══════════════════════════════════════════════════════════════════════════

// Validation schema for player creation
const createPlayerSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    rules: [rules.email, rules.maxLength(255) as unknown as typeof rules.email],
  },
  firstName: {
    required: true,
    type: 'string',
    rules: [rules.minLength(2) as unknown as typeof rules.email, rules.maxLength(100) as unknown as typeof rules.email],
  },
  lastName: {
    required: true,
    type: 'string',
    rules: [rules.minLength(2) as unknown as typeof rules.email, rules.maxLength(100) as unknown as typeof rules.email],
  },
  position: {
    required: true,
    type: 'string',
    rules: [rules.oneOf(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P']) as unknown as typeof rules.email],
  },
  graduationYear: {
    required: true,
    type: 'number',
    rules: [rules.min(2024) as unknown as typeof rules.email, rules.max(2030) as unknown as typeof rules.email],
  },
  gpa: {
    type: 'number',
    rules: [rules.min(0) as unknown as typeof rules.email, rules.max(4) as unknown as typeof rules.email],
  },
};

// Example API route: POST /api/players
const examplePOST = withErrorHandler(async (request: Request) => {
  // 1. Parse and validate request body
  const body = await parseJsonBody(request, createPlayerSchema);

  // 2. Check authentication
  const token = requireAuth(request);

  // 3. Verify permissions (example)
  // const user = await verifyToken(token);
  // if (user.role !== 'admin' && user.role !== 'coach') {
  //   throw new ForbiddenError('Only admins and coaches can create players');
  // }

  // 4. Business logic with try-catch
  const result = await tryCatch(async () => {
    // Simulate database operation
    // const player = await db.player.create({ data: body });
    const player = { id: '123', ...body, createdAt: new Date() };
    return player;
  }, { method: 'POST', path: '/api/players' });

  if (!result.success) {
    throw result.error;
  }

  // 5. Return success response
  return createSuccessResponse(result.data, HttpStatus.CREATED);
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Service Layer with Error Handling
// ═══════════════════════════════════════════════════════════════════════════

class PlayerService {
  async getPlayerById(id: string, context?: ErrorContext) {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Player ID is required');
    }

    // Try to fetch player
    const result = await tryCatch(async () => {
      // Simulate database query
      // const player = await db.player.findUnique({ where: { id } });
      const player = null; // Simulating not found

      if (!player) {
        throw new NotFoundError(`Player with ID ${id} not found`);
      }

      return player;
    }, context);

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }

  async updatePlayer(id: string, data: Record<string, unknown>, context?: ErrorContext) {
    // Validate update data
    const updateSchema: ValidationSchema = {
      firstName: { type: 'string', rules: [rules.minLength(2) as unknown as typeof rules.email] },
      lastName: { type: 'string', rules: [rules.minLength(2) as unknown as typeof rules.email] },
      email: { type: 'string', rules: [rules.email] },
    };

    const validation = validate(data, updateSchema);
    if (!validation.valid) {
      throw new ValidationError('Invalid update data', validation.errors);
    }

    return tryOrThrow(async () => {
      // Simulate update
      // const player = await db.player.update({ where: { id }, data });
      return { id, ...data, updatedAt: new Date() };
    }, `Failed to update player ${id}`, context);
  }

  async deletePlayer(id: string, userId: string, context?: ErrorContext) {
    // Check if user owns this player or is admin
    const canDelete = await this.checkDeletePermission(id, userId);
    if (!canDelete) {
      throw new ForbiddenError('You do not have permission to delete this player', ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS, {
        context: { ...context, playerId: id, userId },
      });
    }

    return tryOrThrow(async () => {
      // Simulate delete
      // await db.player.delete({ where: { id } });
      return { deleted: true, id };
    }, `Failed to delete player ${id}`, context);
  }

  private async checkDeletePermission(playerId: string, userId: string): Promise<boolean> {
    // Simulate permission check
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: React Hook with Error Handling
// ═══════════════════════════════════════════════════════════════════════════

/*
// usePlayer.ts
import { useState, useCallback } from 'react';
import { tryCatch, normalizeError, logger, type AppError } from '@/lib/errors';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function usePlayer(playerId: string) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchPlayer = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await tryCatch(async () => {
      const res = await fetch(`/api/players/${playerId}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      return data.data as Player;
    }, { path: `/api/players/${playerId}`, method: 'GET' });

    setLoading(false);

    if (result.success) {
      setPlayer(result.data);
    } else {
      setError(result.error);
      logger.warn('Failed to fetch player', result.error, { playerId });
    }
  }, [playerId]);

  const updatePlayer = useCallback(async (data: Partial<Player>) => {
    setLoading(true);
    setError(null);

    const result = await tryCatch(async () => {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error.message);
      }

      return json.data as Player;
    }, { path: `/api/players/${playerId}`, method: 'PATCH' });

    setLoading(false);

    if (result.success) {
      setPlayer(result.data);
      return { success: true, data: result.data };
    } else {
      setError(result.error);
      return { success: false, error: result.error };
    }
  }, [playerId]);

  return {
    player,
    loading,
    error,
    fetchPlayer,
    updatePlayer,
    clearError: () => setError(null),
  };
}
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Database Operations with Error Handling
// ═══════════════════════════════════════════════════════════════════════════

/*
// Database wrapper example
import { createClient } from '@supabase/supabase-js';
import { DatabaseError, NotFoundError, ConflictError, ErrorCodes, tryOrThrow, logger } from '@/lib/errors';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function getPlayer(id: string) {
  return tryOrThrow(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Player ${id} not found`);
      }
      throw new DatabaseError(error.message, ErrorCodes.DATABASE_QUERY_FAILED, {
        context: { table: 'players', operation: 'select' },
        cause: error as unknown as Error,
      });
    }

    return data;
  }, 'Failed to fetch player');
}

async function createPlayer(data: Record<string, unknown>) {
  return tryOrThrow(async () => {
    const { data: player, error } = await supabase
      .from('players')
      .insert(data)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        throw new ConflictError('A player with this email already exists');
      }
      throw new DatabaseError(error.message, ErrorCodes.DATABASE_QUERY_FAILED);
    }

    return player;
  }, 'Failed to create player');
}
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Middleware with Error Handling
// ═══════════════════════════════════════════════════════════════════════════

/*
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError, logger, normalizeError, createErrorResponse } from '@/lib/errors';

export async function middleware(request: NextRequest) {
  try {
    // Check authentication for protected routes
    if (request.nextUrl.pathname.startsWith('/api/protected')) {
      const token = request.headers.get('Authorization')?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedError('Authentication required');
      }

      // Verify token (example)
      // const user = await verifyToken(token);
      // if (!user) {
      //   throw new UnauthorizedError('Invalid token');
      // }
    }

    // Check admin routes
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      // const user = getCurrentUser();
      // if (user?.role !== 'admin') {
      //   throw new ForbiddenError('Admin access required');
      // }
    }

    return NextResponse.next();
  } catch (error) {
    const appError = normalizeError(error, {
      path: request.nextUrl.pathname,
      method: request.method,
    });

    logger.logAppError(appError);

    // Return error response for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify(appError.toResponse()), {
        status: appError.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Redirect to login for page routes
    if (appError instanceof UnauthorizedError) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect to 403 page for forbidden
    if (appError instanceof ForbiddenError) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  }
}
*/

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Form Validation
// ═══════════════════════════════════════════════════════════════════════════

/*
// Form validation example
import { validate, rules, ValidationError, type ValidationSchema } from '@/lib/errors';

const registrationSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    rules: [rules.email],
  },
  password: {
    required: true,
    type: 'string',
    rules: [
      rules.minLength(8),
      rules.maxLength(100),
      rules.pattern(/[A-Z]/, 'Password must contain at least one uppercase letter'),
      rules.pattern(/[a-z]/, 'Password must contain at least one lowercase letter'),
      rules.pattern(/[0-9]/, 'Password must contain at least one number'),
    ],
  },
  confirmPassword: {
    required: true,
    type: 'string',
  },
  firstName: {
    required: true,
    type: 'string',
    rules: [rules.minLength(2), rules.maxLength(50)],
  },
  lastName: {
    required: true,
    type: 'string',
    rules: [rules.minLength(2), rules.maxLength(50)],
  },
  dateOfBirth: {
    required: true,
    rules: [rules.date],
  },
};

function validateRegistration(data: Record<string, unknown>) {
  // Basic schema validation
  const result = validate(data, registrationSchema);

  // Custom cross-field validation
  if (data.password !== data.confirmPassword) {
    result.errors.push({
      field: 'confirmPassword',
      constraint: 'match',
      message: 'Passwords do not match',
    });
    result.valid = false;
  }

  if (!result.valid) {
    throw new ValidationError('Registration validation failed', result.errors);
  }

  return true;
}
*/

// Export examples for reference
export {
  createPlayerSchema,
  examplePOST,
  PlayerService,
};
