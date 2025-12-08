'use client';

import { cn } from '@/lib/utils';

// Base skeleton with shimmer animation
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = 'default', style }: SkeletonProps) {
  const variantClasses = {
    default: 'bg-slate-200',
    glass: 'bg-white/10 backdrop-blur-sm',
    dark: 'bg-slate-700/50 backdrop-blur-sm',
  };

  return (
    <div
      className={cn(
        'animate-shimmer rounded-md',
        variantClasses[variant],
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        backgroundImage:
          variant === 'default'
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        ...style,
      }}
    />
  );
}

// ============================================
// CARD SKELETONS
// ============================================

interface CardSkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  showAvatar?: boolean;
  showImage?: boolean;
  lines?: number;
}

export function CardSkeleton({
  className,
  variant = 'glass',
  showAvatar = true,
  showImage = false,
  lines = 3,
}: CardSkeletonProps) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 space-y-4',
        containerClasses[variant],
        className
      )}
    >
      {showImage && (
        <Skeleton variant={variant} className="h-40 w-full rounded-lg" />
      )}
      
      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton variant={variant} className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton variant={variant} className="h-4 w-1/3" />
            <Skeleton variant={variant} className="h-3 w-1/4" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            className={cn(
              'h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton({
  className,
  variant = 'glass',
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 space-y-3',
        containerClasses[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton variant={variant} className="h-4 w-24" />
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton variant={variant} className="h-8 w-20" />
      <Skeleton variant={variant} className="h-3 w-16" />
    </div>
  );
}

// Profile card skeleton
export function ProfileCardSkeleton({
  className,
  variant = 'glass',
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 space-y-4',
        containerClasses[variant],
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton variant={variant} className="h-20 w-20 rounded-full" />
        <div className="space-y-2 text-center w-full">
          <Skeleton variant={variant} className="h-5 w-32 mx-auto" />
          <Skeleton variant={variant} className="h-3 w-24 mx-auto" />
        </div>
      </div>
      <div className="flex justify-center gap-4 pt-2">
        <Skeleton variant={variant} className="h-9 w-24 rounded-lg" />
        <Skeleton variant={variant} className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================
// LIST ITEM SKELETONS
// ============================================

interface ListItemSkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  showAvatar?: boolean;
  showActions?: boolean;
}

export function ListItemSkeleton({
  className,
  variant = 'glass',
  showAvatar = true,
  showActions = true,
}: ListItemSkeletonProps) {
  const containerClasses = {
    default: 'bg-white border-b border-slate-200',
    glass: 'bg-white/5 backdrop-blur-sm border-b border-white/10',
    dark: 'bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4',
        containerClasses[variant],
        className
      )}
    >
      {showAvatar && (
        <Skeleton variant={variant} className="h-10 w-10 rounded-full shrink-0" />
      )}
      
      <div className="flex-1 space-y-2">
        <Skeleton variant={variant} className="h-4 w-1/3" />
        <Skeleton variant={variant} className="h-3 w-1/2" />
      </div>
      
      {showActions && (
        <div className="flex gap-2">
          <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
          <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
        </div>
      )}
    </div>
  );
}

// List skeleton (multiple items)
export function ListSkeleton({
  className,
  variant = 'glass',
  items = 5,
  showAvatar = true,
  showActions = true,
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div className={cn('rounded-xl overflow-hidden', containerClasses[variant], className)}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton
          key={i}
          variant={variant}
          showAvatar={showAvatar}
          showActions={showActions}
          className={i === items - 1 ? 'border-b-0' : ''}
        />
      ))}
    </div>
  );
}

// ============================================
// TABLE ROW SKELETONS
// ============================================

interface TableRowSkeletonProps {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  columns?: number;
  showCheckbox?: boolean;
}

export function TableRowSkeleton({
  className,
  variant = 'glass',
  columns = 5,
  showCheckbox = false,
}: TableRowSkeletonProps) {
  const containerClasses = {
    default: 'border-b border-slate-200',
    glass: 'border-b border-white/10',
    dark: 'border-b border-slate-700/50',
  };

  return (
    <tr className={cn(containerClasses[variant], className)}>
      {showCheckbox && (
        <td className="p-4">
          <Skeleton variant={variant} className="h-4 w-4 rounded" />
        </td>
      )}
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton
            variant={variant}
            className={cn(
              'h-4',
              i === 0 ? 'w-32' : i === columns - 1 ? 'w-16' : 'w-24'
            )}
          />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton (header + rows)
export function TableSkeleton({
  className,
  variant = 'glass',
  rows = 5,
  columns = 5,
  showCheckbox = false,
  showHeader = true,
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
  showHeader?: boolean;
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  const headerClasses = {
    default: 'bg-slate-50',
    glass: 'bg-white/5',
    dark: 'bg-slate-700/30',
  };

  return (
    <div className={cn('rounded-xl overflow-hidden', containerClasses[variant], className)}>
      <table className="w-full">
        {showHeader && (
          <thead className={headerClasses[variant]}>
            <tr>
              {showCheckbox && (
                <th className="p-4 text-left">
                  <Skeleton variant={variant} className="h-4 w-4 rounded" />
                </th>
              )}
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4 text-left">
                  <Skeleton variant={variant} className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton
              key={i}
              variant={variant}
              columns={columns}
              showCheckbox={showCheckbox}
              className={i === rows - 1 ? 'border-b-0' : ''}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// SPECIALIZED SKELETONS
// ============================================

// Player card skeleton (for sports apps)
export function PlayerCardSkeleton({
  className,
  variant = 'glass',
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 space-y-4',
        containerClasses[variant],
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant={variant} className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton variant={variant} className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton variant={variant} className="h-5 w-12 rounded-full" />
            <Skeleton variant={variant} className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton variant={variant} className="h-6 w-12 mx-auto" />
            <Skeleton variant={variant} className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton variant={variant} className="h-9 flex-1 rounded-lg" />
        <Skeleton variant={variant} className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({
  className,
  variant = 'glass',
  type = 'bar',
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  type?: 'bar' | 'line' | 'pie';
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 space-y-4',
        containerClasses[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton variant={variant} className="h-5 w-32" />
        <Skeleton variant={variant} className="h-8 w-24 rounded-lg" />
      </div>
      
      {type === 'bar' && (
        <div className="flex items-end justify-around h-48 gap-2 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              variant={variant}
              className="w-8 rounded-t-md"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      )}
      
      {type === 'line' && (
        <div className="h-48 flex items-center justify-center">
          <Skeleton variant={variant} className="h-full w-full rounded-lg" />
        </div>
      )}
      
      {type === 'pie' && (
        <div className="h-48 flex items-center justify-center">
          <Skeleton variant={variant} className="h-40 w-40 rounded-full" />
        </div>
      )}
      
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant={variant} className="h-3 w-3 rounded-full" />
            <Skeleton variant={variant} className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({
  className,
  variant = 'glass',
  fields = 4,
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  fields?: number;
}) {
  const containerClasses = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 space-y-6',
        containerClasses[variant],
        className
      )}
    >
      <Skeleton variant={variant} className="h-6 w-40" />
      
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant={variant} className="h-4 w-24" />
            <Skeleton variant={variant} className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      
      <div className="flex gap-3 pt-2">
        <Skeleton variant={variant} className="h-10 w-24 rounded-lg" />
        <Skeleton variant={variant} className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton({
  className,
  variant = 'glass',
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant={variant} className="h-8 w-48" />
          <Skeleton variant={variant} className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant={variant} className="h-10 w-10 rounded-lg" />
          <Skeleton variant={variant} className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Grid of cards skeleton
export function CardGridSkeleton({
  className,
  variant = 'glass',
  cards = 6,
  columns = 3,
}: {
  className?: string;
  variant?: 'default' | 'glass' | 'dark';
  cards?: number;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

// Export default
export default Skeleton;
