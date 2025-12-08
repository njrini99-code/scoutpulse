'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
  Component,
  ErrorInfo,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  ErrorCodes,
  HttpStatus,
  logger,
  normalizeError,
  type ErrorContext,
} from './index';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecoveryAction =
  | 'retry'
  | 'refresh'
  | 'navigate_home'
  | 'navigate_back'
  | 'login'
  | 'clear_cache'
  | 'report'
  | 'ignore'
  | 'custom';

export interface RecoveryStrategy {
  action: RecoveryAction;
  label: string;
  description?: string;
  handler?: () => void | Promise<void>;
  autoExecute?: boolean;
  autoExecuteDelay?: number; // ms
}

export interface GlobalError {
  id: string;
  error: AppError;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: ErrorContext;
  recoveryStrategies: RecoveryStrategy[];
  handled: boolean;
  dismissed: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorStats {
  total: number;
  handled: number;
  unhandled: number;
  byType: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface GlobalErrorContextValue {
  // State
  errors: GlobalError[];
  currentError: GlobalError | null;
  hasErrors: boolean;
  isRecovering: boolean;
  stats: ErrorStats;

  // Actions
  reportError: (error: Error | AppError, context?: ErrorContext) => GlobalError;
  dismissError: (errorId: string) => void;
  dismissAllErrors: () => void;
  retryError: (errorId: string) => Promise<boolean>;
  executeRecovery: (errorId: string, action: RecoveryAction) => Promise<boolean>;
  clearErrors: () => void;

  // Error boundary helpers
  resetErrorBoundary: () => void;
  setRecoveryHandler: (handler: () => void) => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextValue | null>(null);

export function useGlobalError() {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within GlobalErrorProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

function classifyErrorSeverity(error: AppError): ErrorSeverity {
  // Critical - system is broken
  if (
    error instanceof InternalError ||
    error instanceof DatabaseError ||
    error.statusCode === HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    return 'critical';
  }

  // High - user cannot proceed
  if (
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof ServiceUnavailableError
  ) {
    return 'high';
  }

  // Medium - action failed but can retry
  if (
    error instanceof ExternalServiceError ||
    error instanceof RateLimitError ||
    error.statusCode === HttpStatus.TOO_MANY_REQUESTS
  ) {
    return 'medium';
  }

  // Low - validation or expected errors
  if (
    error instanceof BadRequestError ||
    error instanceof ValidationError ||
    error instanceof NotFoundError
  ) {
    return 'low';
  }

  return 'medium';
}

function getRecoveryStrategies(error: AppError, router: ReturnType<typeof useRouter>): RecoveryStrategy[] {
  const strategies: RecoveryStrategy[] = [];

  // Unauthorized - redirect to login
  if (error instanceof UnauthorizedError || error.code === ErrorCodes.AUTH_REQUIRED) {
    strategies.push({
      action: 'login',
      label: 'Sign In',
      description: 'Return to the login page',
      handler: () => router.push('/auth/login'),
    });
  }

  // Rate limit - wait and retry
  if (error instanceof RateLimitError) {
    strategies.push({
      action: 'retry',
      label: 'Try Again',
      description: 'Wait and retry the request',
      autoExecute: true,
      autoExecuteDelay: 60000, // 1 minute
    });
  }

  // Validation error - allow retry
  if (error instanceof ValidationError || error instanceof BadRequestError) {
    strategies.push({
      action: 'retry',
      label: 'Try Again',
      description: 'Fix the issue and try again',
    });
  }

  // Not found - navigate home
  if (error instanceof NotFoundError) {
    strategies.push({
      action: 'navigate_home',
      label: 'Go Home',
      description: 'Return to the home page',
      handler: () => router.push('/'),
    });
    strategies.push({
      action: 'navigate_back',
      label: 'Go Back',
      description: 'Return to the previous page',
      handler: () => router.back(),
    });
  }

  // Server/Database errors - refresh or retry
  if (
    error instanceof InternalError ||
    error instanceof DatabaseError ||
    error instanceof ServiceUnavailableError
  ) {
    strategies.push({
      action: 'refresh',
      label: 'Refresh Page',
      description: 'Reload the current page',
      handler: () => window.location.reload(),
    });
    strategies.push({
      action: 'retry',
      label: 'Try Again',
      description: 'Retry the failed operation',
    });
  }

  // External service errors - retry with backoff
  if (error instanceof ExternalServiceError) {
    strategies.push({
      action: 'retry',
      label: 'Retry',
      description: 'Try the operation again',
    });
  }

  // Always allow reporting and ignoring
  strategies.push({
    action: 'report',
    label: 'Report Issue',
    description: 'Send error report to support',
  });

  strategies.push({
    action: 'ignore',
    label: 'Dismiss',
    description: 'Dismiss this error',
  });

  return strategies;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface GlobalErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  maxRetries?: number;
  onError?: (error: GlobalError) => void;
  onRecovery?: (errorId: string, action: RecoveryAction) => void;
  reportingEndpoint?: string;
}

export function GlobalErrorProvider({
  children,
  maxErrors = 10,
  maxRetries = 3,
  onError,
  onRecovery,
  reportingEndpoint,
}: GlobalErrorProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [errors, setErrors] = useState<GlobalError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryHandler, setRecoveryHandlerState] = useState<(() => void) | null>(null);

  // Get current (most recent unhandled) error
  const currentError = useMemo(() => {
    return errors.find(e => !e.handled && !e.dismissed) || null;
  }, [errors]);

  // Calculate stats
  const stats = useMemo((): ErrorStats => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<ErrorSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    let handled = 0;
    let unhandled = 0;

    for (const error of errors) {
      // By type
      const typeName = error.error.constructor.name;
      byType[typeName] = (byType[typeName] || 0) + 1;

      // By severity
      bySeverity[error.severity]++;

      // Handled/unhandled
      if (error.handled || error.dismissed) {
        handled++;
      } else {
        unhandled++;
      }
    }

    return {
      total: errors.length,
      handled,
      unhandled,
      byType,
      bySeverity,
    };
  }, [errors]);

  // Report a new error
  const reportError = useCallback((
    error: Error | AppError,
    context?: ErrorContext
  ): GlobalError => {
    const appError = error instanceof AppError ? error : normalizeError(error, context);
    const severity = classifyErrorSeverity(appError);
    const strategies = getRecoveryStrategies(appError, router);

    const globalError: GlobalError = {
      id: `error_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      error: appError,
      severity,
      timestamp: new Date(),
      context: {
        ...context,
        path: pathname,
      },
      recoveryStrategies: strategies,
      handled: false,
      dismissed: false,
      retryCount: 0,
      maxRetries,
    };

    // Log the error
    logger.logAppError(appError, globalError.context);

    // Add to errors list
    setErrors(prev => {
      const next = [globalError, ...prev];
      // Keep only maxErrors
      if (next.length > maxErrors) {
        return next.slice(0, maxErrors);
      }
      return next;
    });

    // Call callback
    onError?.(globalError);

    // Auto-execute recovery if configured
    const autoStrategy = strategies.find(s => s.autoExecute);
    if (autoStrategy) {
      setTimeout(() => {
        executeRecovery(globalError.id, autoStrategy.action);
      }, autoStrategy.autoExecuteDelay || 0);
    }

    return globalError;
  }, [pathname, router, maxErrors, maxRetries, onError]);

  // Dismiss a single error
  const dismissError = useCallback((errorId: string) => {
    setErrors(prev => prev.map(e =>
      e.id === errorId ? { ...e, dismissed: true } : e
    ));
  }, []);

  // Dismiss all errors
  const dismissAllErrors = useCallback(() => {
    setErrors(prev => prev.map(e => ({ ...e, dismissed: true })));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Retry an error's original operation
  const retryError = useCallback(async (errorId: string): Promise<boolean> => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    if (error.retryCount >= error.maxRetries) {
      logger.warn(`Max retries (${error.maxRetries}) reached for error ${errorId}`);
      return false;
    }

    setErrors(prev => prev.map(e =>
      e.id === errorId ? { ...e, retryCount: e.retryCount + 1 } : e
    ));

    setIsRecovering(true);
    try {
      // Execute recovery handler if set
      if (recoveryHandler) {
        await recoveryHandler();
        setErrors(prev => prev.map(e =>
          e.id === errorId ? { ...e, handled: true } : e
        ));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [errors, recoveryHandler]);

  // Execute a specific recovery strategy
  const executeRecovery = useCallback(async (
    errorId: string,
    action: RecoveryAction
  ): Promise<boolean> => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    const strategy = error.recoveryStrategies.find(s => s.action === action);
    if (!strategy) return false;

    setIsRecovering(true);
    try {
      switch (action) {
        case 'retry':
          return await retryError(errorId);

        case 'refresh':
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          return true;

        case 'navigate_home':
          router.push('/');
          dismissError(errorId);
          return true;

        case 'navigate_back':
          router.back();
          dismissError(errorId);
          return true;

        case 'login':
          router.push('/auth/login');
          dismissError(errorId);
          return true;

        case 'clear_cache':
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
          }
          dismissError(errorId);
          return true;

        case 'report':
          await sendErrorReport(error, reportingEndpoint);
          setErrors(prev => prev.map(e =>
            e.id === errorId ? { ...e, handled: true } : e
          ));
          return true;

        case 'ignore':
          dismissError(errorId);
          return true;

        case 'custom':
          if (strategy.handler) {
            await strategy.handler();
            dismissError(errorId);
            return true;
          }
          return false;

        default:
          return false;
      }
    } catch (recoveryError) {
      logger.error('Recovery action failed', recoveryError as Error, { errorId, action });
      return false;
    } finally {
      setIsRecovering(false);
      onRecovery?.(errorId, action);
    }
  }, [errors, router, retryError, dismissError, onRecovery, reportingEndpoint]);

  // Reset error boundary
  const resetErrorBoundary = useCallback(() => {
    dismissAllErrors();
    if (recoveryHandler) {
      recoveryHandler();
    }
  }, [dismissAllErrors, recoveryHandler]);

  // Set recovery handler
  const setRecoveryHandler = useCallback((handler: () => void) => {
    setRecoveryHandlerState(() => handler);
  }, []);

  // Global error listener
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      reportError(event.reason, { source: 'unhandledRejection' });
    };

    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      reportError(event.error || new Error(event.message), {
        source: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
  }, [reportError]);

  const value = useMemo((): GlobalErrorContextValue => ({
    errors,
    currentError,
    hasErrors: errors.some(e => !e.handled && !e.dismissed),
    isRecovering,
    stats,
    reportError,
    dismissError,
    dismissAllErrors,
    retryError,
    executeRecovery,
    clearErrors,
    resetErrorBoundary,
    setRecoveryHandler,
  }), [
    errors,
    currentError,
    isRecovering,
    stats,
    reportError,
    dismissError,
    dismissAllErrors,
    retryError,
    executeRecovery,
    clearErrors,
    resetErrorBoundary,
    setRecoveryHandler,
  ]);

  return (
    <GlobalErrorContext.Provider value={value}>
      {children}
    </GlobalErrorContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR REPORTING
// ═══════════════════════════════════════════════════════════════════════════

async function sendErrorReport(
  error: GlobalError,
  endpoint?: string
): Promise<void> {
  const report = {
    errorId: error.id,
    errorCode: error.error.code,
    errorMessage: error.error.message,
    severity: error.severity,
    timestamp: error.timestamp.toISOString(),
    context: error.context,
    stack: error.error.stack,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  if (endpoint) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch {
      // Fallback to console if reporting fails
      console.error('Failed to send error report:', report);
    }
  } else {
    // Just log to console
    console.error('Error Report:', report);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

class AppErrorBoundaryClass extends Component<
  AppErrorBoundaryProps & { reportError: GlobalErrorContextValue['reportError']; resetBoundary: () => void },
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps & { reportError: GlobalErrorContextValue['reportError']; resetBoundary: () => void }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.reportError(error, {
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.resetBoundary();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.resetErrorBoundary);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback error={this.state.error} reset={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

// Wrapper to connect class component to context
export function AppErrorBoundary({ children, fallback }: AppErrorBoundaryProps) {
  const { reportError, resetErrorBoundary } = useGlobalError();

  return (
    <AppErrorBoundaryClass
      reportError={reportError}
      resetBoundary={resetErrorBoundary}
      fallback={fallback}
    >
      {children}
    </AppErrorBoundaryClass>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT ERROR FALLBACK UI
// ═══════════════════════════════════════════════════════════════════════════

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-white/60 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GlobalErrorDisplay() {
  const { currentError, executeRecovery, isRecovering } = useGlobalError();

  if (!currentError) return null;

  const severityStyles = {
    low: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    medium: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    high: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    critical: 'bg-red-500/20 border-red-500/30 text-red-400',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
      <div className={`rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden ${severityStyles[currentError.severity]}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">{currentError.error.message}</p>
              <p className="text-sm opacity-70 mt-1">
                {currentError.error.code}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-black/20">
          {currentError.recoveryStrategies.slice(0, 3).map((strategy) => (
            <button
              key={strategy.action}
              onClick={() => executeRecovery(currentError.id, strategy.action)}
              disabled={isRecovering}
              className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              {strategy.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default GlobalErrorProvider;
