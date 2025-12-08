'use client';

import React, { Component, ErrorInfo, ReactNode, createContext, useContext, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Loader2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const errorStyles = `
/* Error shake animation */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.error-shake {
  animation: error-shake 0.5s ease-in-out;
}

/* Fade in animation */
@keyframes error-fade-in {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.error-fade-in {
  animation: error-fade-in 0.3s ease-out forwards;
}

/* Pulse for icon */
@keyframes error-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.error-icon-pulse {
  animation: error-pulse 2s ease-in-out infinite;
}

/* Copy success */
@keyframes copy-success {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.copy-success {
  animation: copy-success 0.3s ease-out forwards;
}

/* Expand animation */
@keyframes details-expand {
  0% { opacity: 0; max-height: 0; }
  100% { opacity: 1; max-height: 500px; }
}

.details-expand {
  animation: details-expand 0.3s ease-out forwards;
  overflow: hidden;
}

/* Button hover glow */
.error-btn-glow:hover {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.success-btn-glow:hover {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}
`;

let stylesInjected = false;
function injectErrorStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'error-boundary-styles';
  style.textContent = errorStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  componentStack: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorReportingService {
  report: (report: ErrorReport) => Promise<void>;
  name: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  reportingService?: ErrorReportingService;
  showDetails?: boolean;
  showReportButton?: boolean;
  userId?: string;
  metadata?: Record<string, unknown>;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorContextValue {
  captureError: (error: Error, context?: Record<string, unknown>) => void;
  reportError: (error: Error, context?: Record<string, unknown>) => Promise<void>;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useErrorHandler() {
  const context = useContext(ErrorContext);
  
  const captureError = useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('[ErrorBoundary] Captured error:', error, context);
    if (context) {
      console.error('[ErrorBoundary] Context:', context);
    }
  }, []);

  const reportError = useCallback(async (error: Error, errorContext?: Record<string, unknown>) => {
    console.error('[ErrorBoundary] Reporting error:', error, errorContext);
    // Default implementation - just logs
    // Override with actual reporting service
  }, []);

  return context ?? { captureError, reportError };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT ERROR REPORTING SERVICES
// ═══════════════════════════════════════════════════════════════════════════

/** Console-based error reporting (development) */
export const consoleReportingService: ErrorReportingService = {
  name: 'Console',
  report: async (report) => {
    console.group('🚨 Error Report');
    console.error('Error:', report.error);
    console.error('Component Stack:', report.componentStack);
    console.error('Timestamp:', report.timestamp);
    console.error('URL:', report.url);
    console.error('User Agent:', report.userAgent);
    if (report.userId) console.error('User ID:', report.userId);
    if (report.metadata) console.error('Metadata:', report.metadata);
    console.groupEnd();
  },
};

/** Webhook-based error reporting */
export function createWebhookReportingService(webhookUrl: string): ErrorReportingService {
  return {
    name: 'Webhook',
    report: async (report) => {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...report,
            error: {
              name: report.error.name,
              message: report.error.message,
              stack: report.error.stack,
            },
          }),
        });
      } catch (err) {
        console.error('[ErrorBoundary] Failed to send error report:', err);
      }
    },
  };
}

/** Supabase-based error reporting */
export function createSupabaseReportingService(
  supabaseUrl: string,
  supabaseKey: string,
  tableName = 'error_logs'
): ErrorReportingService {
  return {
    name: 'Supabase',
    report: async (report) => {
      try {
        await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            error_name: report.error.name,
            error_message: report.error.message,
            error_stack: report.error.stack,
            component_stack: report.componentStack,
            url: report.url,
            user_agent: report.userAgent,
            user_id: report.userId,
            metadata: report.metadata,
            created_at: report.timestamp,
          }),
        });
      } catch (err) {
        console.error('[ErrorBoundary] Failed to send error to Supabase:', err);
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR UI COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onReport?: () => Promise<void>;
  showDetails?: boolean;
  showReportButton?: boolean;
  className?: string;
}

function ErrorUI({
  error,
  errorInfo,
  onReset,
  onReport,
  showDetails = true,
  showReportButton = true,
  className,
}: ErrorUIProps) {
  const [showStack, setShowStack] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const handleCopyError = async () => {
    const errorText = `
Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'N/A'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Time: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  const handleReport = async () => {
    if (!onReport || reporting || reported) return;
    setReporting(true);
    try {
      await onReport();
      setReported(true);
    } catch (err) {
      console.error('Failed to report error:', err);
    } finally {
      setReporting(false);
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className={cn(
      'min-h-[400px] flex items-center justify-center p-6 error-fade-in',
      className
    )}>
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-red-500/20 shadow-2xl shadow-red-500/10 overflow-hidden error-shake">
          {/* Header */}
          <div className="px-6 py-8 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 mb-4 error-icon-pulse">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-white/60 max-w-sm mx-auto">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </p>
          </div>

          {/* Error summary */}
          <div className="px-6 py-4 bg-red-500/5 border-b border-white/10">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-400">{error.name}</p>
                <p className="text-sm text-white/70 break-words">{error.message}</p>
              </div>
              <button
                onClick={handleCopyError}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                title="Copy error details"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400 copy-success" />
                ) : (
                  <Copy className="w-4 h-4 text-white/40" />
                )}
              </button>
            </div>
          </div>

          {/* Expandable stack trace */}
          {showDetails && errorInfo?.componentStack && (
            <div className="border-b border-white/10">
              <button
                onClick={() => setShowStack(!showStack)}
                className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-sm text-white/60">Technical Details</span>
                {showStack ? (
                  <ChevronUp className="w-4 h-4 text-white/40" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              {showStack && (
                <div className="details-expand">
                  <div className="px-6 pb-4">
                    <pre className="text-xs text-white/50 bg-black/30 rounded-lg p-4 overflow-x-auto max-h-48 overflow-y-auto">
                      {error.stack}
                      {'\n\nComponent Stack:'}
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-6 space-y-3">
            {/* Primary actions */}
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all success-btn-glow"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>

            {/* Secondary actions */}
            <div className="flex gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              {showReportButton && onReport && (
                <button
                  onClick={handleReport}
                  disabled={reporting || reported}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all',
                    reported
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-white/10 text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {reporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : reported ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {reported ? 'Reported' : 'Report Issue'}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white/5 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">
              Error ID: {Date.now().toString(36).toUpperCase()}
              {' · '}
              <a href="/help" className="hover:text-white/60 inline-flex items-center gap-1">
                Get Help <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINIMAL ERROR UI
// ═══════════════════════════════════════════════════════════════════════════

interface MinimalErrorUIProps {
  error: Error;
  onReset: () => void;
  className?: string;
}

export function MinimalErrorUI({ error, onReset, className }: MinimalErrorUIProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-6 text-center error-fade-in',
      className
    )}>
      <div className="p-3 rounded-xl bg-red-500/20 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">Something went wrong</h3>
      <p className="text-sm text-white/60 mb-4 max-w-xs">{error.message}</p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE ERROR UI
// ═══════════════════════════════════════════════════════════════════════════

interface InlineErrorUIProps {
  error: Error;
  onReset: () => void;
  className?: string;
}

export function InlineErrorUI({ error, onReset, className }: InlineErrorUIProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 error-fade-in',
      className
    )}>
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="flex-1 text-sm text-white/80">{error.message}</p>
      <button
        onClick={onReset}
        className="shrink-0 p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        title="Retry"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY CLASS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidMount(): void {
    injectErrorStyles();
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log error
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call onError callback
    this.props.onError?.(error, errorInfo);

    // Report to external service
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo): Promise<void> => {
    const { reportingService, userId, metadata } = this.props;

    if (!reportingService) {
      // Use console reporting by default in development
      if (process.env.NODE_ENV === 'development') {
        await consoleReportingService.report(this.createErrorReport(error, errorInfo));
      }
      return;
    }

    try {
      await reportingService.report(this.createErrorReport(error, errorInfo));
    } catch (err) {
      console.error('[ErrorBoundary] Failed to report error:', err);
    }
  };

  private createErrorReport = (error: Error, errorInfo: ErrorInfo): ErrorReport => {
    const { userId, metadata } = this.props;

    return {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId,
      metadata,
    };
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  private handleReport = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    if (!error || !errorInfo) return;

    await this.reportError(error, errorInfo);
  };

  render(): ReactNode {
    const {
      children,
      fallback,
      showDetails = true,
      showReportButton = true,
      reportingService,
      className,
    } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      // Custom fallback (function)
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset);
      }

      // Custom fallback (element)
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <ErrorUI
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          onReport={reportingService ? this.handleReport : undefined}
          showDetails={showDetails}
          showReportButton={showReportButton}
          className={className}
        />
      );
    }

    return children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  reportingService?: ErrorReportingService;
  userId?: string;
  metadata?: Record<string, unknown>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function ErrorBoundaryProvider({
  children,
  reportingService,
  userId,
  metadata,
  onError,
}: ErrorBoundaryProviderProps) {
  const captureError = useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error('[ErrorBoundary] Manual capture:', error, context);
    
    if (reportingService) {
      reportingService.report({
        error,
        errorInfo: { componentStack: '' } as ErrorInfo,
        componentStack: new Error().stack || '',
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        userId,
        metadata: { ...metadata, ...context },
      });
    }
  }, [reportingService, userId, metadata]);

  const reportError = useCallback(async (error: Error, context?: Record<string, unknown>) => {
    if (!reportingService) {
      console.warn('[ErrorBoundary] No reporting service configured');
      return;
    }

    await reportingService.report({
      error,
      errorInfo: { componentStack: '' } as ErrorInfo,
      componentStack: new Error().stack || '',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId,
      metadata: { ...metadata, ...context },
    });
  }, [reportingService, userId, metadata]);

  return (
    <ErrorContext.Provider value={{ captureError, reportError }}>
      <ErrorBoundary
        reportingService={reportingService}
        userId={userId}
        metadata={metadata}
        onError={onError}
      >
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/** Hook to throw errors that will be caught by ErrorBoundary */
export function useErrorThrower() {
  const [, setError] = useState<Error>();

  return useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

/** Hook to wrap async functions with error handling */
export function useAsyncError<T extends (...args: unknown[]) => Promise<unknown>>(fn: T) {
  const throwError = useErrorThrower();

  return useCallback(
    async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        throwError(error as Error);
      }
    },
    [fn, throwError]
  ) as T;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type { ErrorBoundaryProps, ErrorReport, ErrorReportingService };
export default ErrorBoundary;
