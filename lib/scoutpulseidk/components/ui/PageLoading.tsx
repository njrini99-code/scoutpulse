'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const pageLoadingStyles = `
/* Shimmer effect */
@keyframes page-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.page-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: page-shimmer 1.5s ease-in-out infinite;
}

/* Pulse animation */
@keyframes page-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.page-pulse {
  animation: page-pulse 2s ease-in-out infinite;
}

/* Spin animation */
@keyframes page-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.page-spin {
  animation: page-spin 1s linear infinite;
}

/* Bounce animation */
@keyframes page-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Fade in */
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-fade-in {
  animation: page-fade-in 0.3s ease-out forwards;
}

/* Logo pulse */
@keyframes logo-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
}

.logo-pulse {
  animation: logo-pulse 2s ease-in-out infinite;
}

/* Progress bar */
@keyframes progress-bar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

.progress-bar-animated {
  animation: progress-bar 2s ease-out infinite;
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'page-loading-styles';
  style.textContent = pageLoadingStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SPINNER
// ═══════════════════════════════════════════════════════════════════════════

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'muted';
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-emerald-500/30 border-t-emerald-500',
    white: 'border-white/30 border-t-white',
    muted: 'border-slate-500/30 border-t-slate-400',
  };

  return (
    <div
      className={cn(
        'rounded-full page-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING DOTS
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'muted';
  className?: string;
}

export function LoadingDots({ size = 'md', color = 'primary', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    primary: 'bg-emerald-500',
    white: 'bg-white',
    muted: 'bg-slate-400',
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn('rounded-full', sizeClasses[size], colorClasses[color])}
          style={{
            animation: `page-bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg bg-white/5 page-shimmer', className)} />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('p-4 rounded-xl bg-white/5 border border-white/5 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 bg-white/5 rounded-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE LOADING VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

interface PageLoadingProps {
  variant?: 'default' | 'minimal' | 'branded' | 'skeleton';
  message?: string;
  showProgress?: boolean;
  className?: string;
}

export function PageLoading({
  variant = 'default',
  message = 'Loading...',
  showProgress = false,
  className,
}: PageLoadingProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center min-h-[200px]', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (variant === 'branded') {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        className
      )}>
        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center logo-pulse">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/30 page-pulse" />
        </div>

        {/* App name */}
        <h1 className="text-2xl font-bold text-white mb-2">ScoutPulse</h1>
        <p className="text-slate-400 mb-6">{message}</p>

        {/* Loading indicator */}
        <LoadingDots size="lg" />

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48 h-1 mt-6 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full progress-bar-animated" />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('p-6 space-y-6', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] page-fade-in',
      className
    )}>
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD LOADING
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardLoading() {
  React.useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="p-6 space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white/5 border border-white/5 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST LOADING
// ═══════════════════════════════════════════════════════════════════════════

export function ListLoading({ count = 5 }: { count?: number }) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="space-y-3 page-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="w-24 h-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD GRID LOADING
// ═══════════════════════════════════════════════════════════════════════════

export function CardGridLoading({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 page-fade-in', gridCols[cols as keyof typeof gridCols] || gridCols[3])}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL PAGE LOADING (for initial app load)
// ═══════════════════════════════════════════════════════════════════════════

export function FullPageLoading() {
  return (
    <PageLoading variant="branded" message="Loading your dashboard..." showProgress />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUSPENSE FALLBACK WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

interface SuspenseFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: PageLoadingProps['variant'];
  message?: string;
}

export function SuspenseFallback({
  children,
  fallback,
  variant = 'default',
  message,
}: SuspenseFallbackProps) {
  return (
    <React.Suspense fallback={fallback || <PageLoading variant={variant} message={message} />}>
      {children}
    </React.Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default PageLoading;
