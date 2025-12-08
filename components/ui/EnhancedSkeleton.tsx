'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const ANIMATION_DURATION = 300; // 300ms base timing

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const baseClasses = 'bg-white/5 rounded';
  
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-skeleton-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
}

// Text skeleton with multiple lines
export function SkeletonText({
  lines = 3,
  className,
  lineHeight = '1rem',
}: {
  lines?: number;
  className?: string;
  lineHeight?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={lineHeight}
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  );
}

// Card skeleton
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl bg-white/5 border border-white/10 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" className="w-1/3" />
          <Skeleton height="0.75rem" className="w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

// Table skeleton
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 bg-white/5 rounded-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="1rem" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height="2rem" className="w-64" />
          <Skeleton height="1rem" className="w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton width={40} height={40} className="rounded-lg" />
          <Skeleton width={128} height={40} className="rounded-lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3"
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <div className="flex items-center justify-between">
              <Skeleton height="1rem" className="w-24" />
              <Skeleton width={32} height={32} className="rounded-lg" />
            </div>
            <Skeleton height="2rem" className="w-20" />
            <Skeleton height="0.75rem" className="w-16" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <Skeleton height="1.5rem" className="w-40" />
          <Skeleton height="256px" className="w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <Skeleton height="1.25rem" className="w-32" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="flex-1 space-y-1">
                  <Skeleton height="1rem" className="w-full" />
                  <Skeleton height="0.75rem" className="w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Global skeleton styles
if (typeof document !== 'undefined') {
  const styleId = 'skeleton-wave-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes skeleton-wave {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .animate-skeleton-wave {
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.03) 25%,
          rgba(255, 255, 255, 0.08) 50%,
          rgba(255, 255, 255, 0.03) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-wave 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
}
