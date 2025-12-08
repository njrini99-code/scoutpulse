'use client';

import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const loadingStyles = `
/* Skeleton shimmer animation */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-shimmer-light {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.05) 25%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Pulse animation for loading indicators */
@keyframes loading-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.loading-pulse {
  animation: loading-pulse 1.5s ease-in-out infinite;
}

/* Bounce animation for dots */
@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

.loading-dot {
  animation: loading-bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) { animation-delay: 0s; }
.loading-dot:nth-child(2) { animation-delay: 0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0.32s; }

/* Fade in animation */
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}

/* Spin animation */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin-slow {
  animation: spin-slow 2s linear infinite;
}

/* Error shake */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.error-shake {
  animation: error-shake 0.5s ease-in-out;
}
`;

let stylesInjected = false;
function injectLoadingStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'loading-states-styles';
  style.textContent = loadingStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string;
  variant?: 'dark' | 'light';
}

/** Basic skeleton line */
export function Skeleton({ className, variant = 'dark' }: SkeletonProps) {
  useEffect(() => { injectLoadingStyles(); }, []);
  
  return (
    <div
      className={cn(
        'rounded',
        variant === 'dark' ? 'skeleton-shimmer' : 'skeleton-shimmer-light',
        className
      )}
    />
  );
}

/** Skeleton for text content */
export function SkeletonText({ lines = 3, className, variant = 'dark' }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton for avatar */
export function SkeletonAvatar({ size = 'md', variant = 'dark' }: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant={variant}
      className={cn('rounded-full', sizeClasses[size])}
    />
  );
}

/** Skeleton card for initial loading */
export function SkeletonCard({ variant = 'dark', showImage = false, showAvatar = true }: SkeletonProps & { showImage?: boolean; showAvatar?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border p-4',
      variant === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
    )}>
      {showImage && (
        <Skeleton variant={variant} className="h-40 w-full rounded-lg mb-4" />
      )}
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <SkeletonAvatar variant={variant} />
          <div className="flex-1">
            <Skeleton variant={variant} className="h-4 w-1/2 mb-2" />
            <Skeleton variant={variant} className="h-3 w-1/3" />
          </div>
        </div>
      )}
      <SkeletonText variant={variant} lines={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant={variant} className="h-8 w-20 rounded-lg" />
        <Skeleton variant={variant} className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton for table rows */
export function SkeletonTable({ rows = 5, columns = 4, variant = 'dark' }: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-white/10">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant={variant} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant={variant} 
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-1/4'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for list items */
export function SkeletonList({ items = 5, variant = 'dark', showIcon = true }: SkeletonProps & { items?: number; showIcon?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showIcon && <Skeleton variant={variant} className="w-10 h-10 rounded-lg shrink-0" />}
          <div className="flex-1">
            <Skeleton variant={variant} className="h-4 w-3/4 mb-2" />
            <Skeleton variant={variant} className="h-3 w-1/2" />
          </div>
          <Skeleton variant={variant} className="w-16 h-6 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for stats grid */
export function SkeletonStats({ count = 4, variant = 'dark' }: SkeletonProps & { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'rounded-xl p-4 border',
            variant === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          )}
        >
          <Skeleton variant={variant} className="h-3 w-1/2 mb-2" />
          <Skeleton variant={variant} className="h-8 w-3/4 mb-1" />
          <Skeleton variant={variant} className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE SKELETON LOADERS
// ═══════════════════════════════════════════════════════════════════════════

/** Full page skeleton for dashboard */
export function PageSkeleton({ variant = 'dark' }: SkeletonProps) {
  return (
    <div className="space-y-6 p-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant={variant} className="h-8 w-48 mb-2" />
          <Skeleton variant={variant} className="h-4 w-32" />
        </div>
        <Skeleton variant={variant} className="h-10 w-32 rounded-xl" />
      </div>
      
      {/* Stats */}
      <SkeletonStats variant={variant} />
      
      {/* Content grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} variant={variant} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for player/profile cards grid */
export function CardGridSkeleton({ count = 6, variant = 'dark' }: SkeletonProps & { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} showAvatar />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INFINITE SCROLL LOADING
// ═══════════════════════════════════════════════════════════════════════════

interface InfiniteScrollLoaderProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
  variant?: 'spinner' | 'dots' | 'skeleton';
  className?: string;
}

/** Loading indicator for infinite scroll */
export function InfiniteScrollLoader({
  loading,
  hasMore,
  onLoadMore,
  threshold = 100,
  variant = 'spinner',
  className,
}: InfiniteScrollLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectLoadingStyles();
  }, []);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  if (!hasMore && !loading) return null;

  return (
    <div 
      ref={loaderRef}
      className={cn('flex items-center justify-center py-8', className)}
    >
      {loading && (
        <>
          {variant === 'spinner' && (
            <div className="flex items-center gap-3 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {variant === 'dots' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
            </div>
          )}
          {variant === 'skeleton' && (
            <div className="w-full space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Hook for infinite scroll functionality */
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  dependencies: React.DependencyList = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchFn, page, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
  }, []);

  // Initial load
  useEffect(() => {
    reset();
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    items,
    loading,
    initialLoading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

interface FilterLoadingProps {
  loading: boolean;
  children: ReactNode;
  className?: string;
}

/** Overlay loading state for filters */
export function FilterLoading({ loading, children, className }: FilterLoadingProps) {
  useEffect(() => { injectLoadingStyles(); }, []);

  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 fade-in-up">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span className="text-sm text-white">Applying filters...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Filter skeleton for dropdown loading */
export function FilterSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="w-8 h-4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════

type EmptyStateVariant = 'no-data' | 'no-results' | 'no-connections' | 'error' | 'custom';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const emptyStateConfig: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  'no-data': {
    icon: FileText,
    title: 'No data yet',
    description: 'Get started by adding your first item.',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  'no-connections': {
    icon: Users,
    title: 'No connections yet',
    description: 'Start connecting with players and coaches to build your network.',
  },
  'error': {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'We encountered an error loading this content. Please try again.',
  },
  'custom': {
    icon: FileText,
    title: 'Empty',
    description: '',
  },
};

/** Empty state component with call-to-action */
export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon: CustomIcon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  useEffect(() => { injectLoadingStyles(); }, []);

  const config = emptyStateConfig[variant];
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  const isError = variant === 'error';

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center fade-in-up',
      isError && 'error-shake',
      className
    )}>
      <div className={cn(
        'p-4 rounded-2xl mb-6',
        isError ? 'bg-red-500/20' : 'bg-white/5'
      )}>
        <Icon className={cn(
          'w-10 h-10',
          isError ? 'text-red-400' : 'text-white/40'
        )} />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{displayTitle}</h3>
      
      {displayDescription && (
        <p className="text-slate-400 max-w-md mb-6">{displayDescription}</p>
      )}
      
      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isError 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
            )}
          >
            {action.icon ? <action.icon className="w-4 h-4" /> : null}
            {action.label}
            {!action.icon && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

/** Quick empty state presets */
export function NoResultsState({ 
  searchTerm, 
  onClearSearch 
}: { 
  searchTerm?: string; 
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      variant="no-results"
      title={searchTerm ? `No results for "${searchTerm}"` : 'No results found'}
      description="Try adjusting your search or filters."
      action={onClearSearch ? { label: 'Clear search', onClick: onClearSearch } : undefined}
    />
  );
}

export function NoDataState({ 
  itemName = 'items',
  onAdd 
}: { 
  itemName?: string;
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      variant="no-data"
      title={`No ${itemName} yet`}
      description={`Get started by adding your first ${itemName.slice(0, -1) || 'item'}.`}
      action={onAdd ? { label: `Add ${itemName.slice(0, -1) || 'item'}`, onClick: onAdd, icon: Plus } : undefined}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATE WITH RETRY
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  className?: string;
}

/** Error state with retry functionality */
export function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try again',
  showDetails = false,
  className,
}: ErrorStateProps) {
  const [showError, setShowError] = useState(false);

  useEffect(() => { injectLoadingStyles(); }, []);

  const errorMessage = message || error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center fade-in-up error-shake',
      className
    )}>
      <div className="p-4 rounded-2xl bg-red-500/20 mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{errorMessage}</p>
      
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </button>
        )}
        
        {showDetails && error && (
          <button
            onClick={() => setShowError(!showError)}
            className="px-5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {showError ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>
      
      {showDetails && showError && error && (
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-left max-w-lg w-full">
          <p className="text-xs text-slate-500 mb-2 font-mono">Error Details:</p>
          <pre className="text-xs text-red-400 overflow-x-auto whitespace-pre-wrap font-mono">
            {error.stack || error.message}
          </pre>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING WRAPPER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingWrapperProps {
  loading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  className?: string;
}

/** Wrapper component that handles loading, error, and empty states */
export function LoadingWrapper({
  loading,
  error,
  isEmpty,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  emptyMessage,
  emptyAction,
  className,
}: LoadingWrapperProps) {
  if (loading) {
    return <>{loadingComponent || <PageSkeleton />}</>;
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorState error={error} onRetry={onRetry} showDetails />
        )}
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        {emptyComponent || (
          <EmptyState
            variant="no-data"
            description={emptyMessage}
            action={emptyAction}
          />
        )}
      </>
    );
  }

  return <div className={className}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE LOADING INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

/** Small inline loading spinner */
export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Loader2 className={cn('animate-spin text-emerald-400', sizeClasses[size], className)} />
  );
}

/** Loading dots animation */
export function LoadingDots({ className }: { className?: string }) {
  useEffect(() => { injectLoadingStyles(); }, []);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
      <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
      <div className="w-2 h-2 rounded-full bg-emerald-500 loading-dot" />
    </div>
  );
}

/** Button loading state */
export function ButtonLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default LoadingWrapper;
