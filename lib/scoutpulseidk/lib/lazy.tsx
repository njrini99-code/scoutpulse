'use client';

/**
 * Lazy Loading Utilities for Next.js
 * 
 * Next.js App Router automatically code-splits pages, but for heavy components
 * within pages, use these utilities for lazy loading with proper Suspense.
 * 
 * Usage:
 * 
 * // 1. Using next/dynamic (recommended for components)
 * const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
 *   loading: () => <ChartSkeleton />,
 *   ssr: false, // Disable SSR for client-only components
 * });
 * 
 * // 2. Using createLazyComponent helper
 * const LazyCalendar = createLazyComponent(
 *   () => import('@/components/Calendar'),
 *   { fallback: <CalendarSkeleton /> }
 * );
 * 
 * // 3. Preloading components
 * preloadComponent(() => import('@/components/Modal'));
 */

import dynamic from 'next/dynamic';
import React, { Suspense, ComponentType, ReactNode } from 'react';
import { PageLoading, Skeleton, SkeletonCard } from '@/components/ui/PageLoading';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type DynamicImport<T> = () => Promise<{ default: ComponentType<T> }>;

interface LazyOptions {
  fallback?: ReactNode;
  ssr?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAZY COMPONENT CREATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a lazy-loaded component with proper loading fallback
 */
export function createLazyComponent<T extends object>(
  importFn: DynamicImport<T>,
  options: LazyOptions = {}
) {
  const {
    fallback = <PageLoading variant="minimal" />,
    ssr = true,
  } = options;

  return dynamic(importFn, {
    loading: () => <>{fallback}</>,
    ssr,
  }) as ComponentType<T>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-CONFIGURED LAZY LOADERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lazy load a chart component (typically client-only)
 */
export function lazyChart<T extends object>(importFn: DynamicImport<T>) {
  return createLazyComponent(importFn, {
    fallback: (
      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    ),
    ssr: false,
  });
}

/**
 * Lazy load a modal component
 */
export function lazyModal<T extends object>(importFn: DynamicImport<T>) {
  return createLazyComponent(importFn, {
    fallback: null,
    ssr: false,
  });
}

/**
 * Lazy load a form component
 */
export function lazyForm<T extends object>(importFn: DynamicImport<T>) {
  return createLazyComponent(importFn, {
    fallback: (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    ),
    ssr: true,
  });
}

/**
 * Lazy load a table component
 */
export function lazyTable<T extends object>(importFn: DynamicImport<T>) {
  return createLazyComponent(importFn, {
    fallback: (
      <div className="space-y-2">
        <div className="flex gap-4 p-3 bg-white/5 rounded-lg">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex gap-4 p-3">
            {[1, 2, 3, 4].map((col) => (
              <Skeleton key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    ),
    ssr: true,
  });
}

/**
 * Lazy load a card grid component
 */
export function lazyCardGrid<T extends object>(importFn: DynamicImport<T>, cardCount = 6) {
  return createLazyComponent(importFn, {
    fallback: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    ),
    ssr: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PRELOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Preload a component (useful for prefetching on hover/focus)
 */
export function preloadComponent<T>(importFn: DynamicImport<T>): void {
  importFn();
}

/**
 * Preload multiple components
 */
export function preloadComponents(importFns: DynamicImport<unknown>[]): void {
  importFns.forEach((fn) => fn());
}

// ═══════════════════════════════════════════════════════════════════════════
// SUSPENSE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

interface LazyBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'default' | 'minimal' | 'skeleton';
}

/**
 * Suspense boundary wrapper with fallback variants
 */
export function LazyBoundary({
  children,
  fallback,
  variant = 'default',
}: LazyBoundaryProps) {
  const getFallback = () => {
    if (fallback) return fallback;
    
    switch (variant) {
      case 'minimal':
        return <PageLoading variant="minimal" />;
      case 'skeleton':
        return <PageLoading variant="skeleton" />;
      default:
        return <PageLoading variant="default" />;
    }
  };

  return <Suspense fallback={getFallback()}>{children}</Suspense>;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAZY ROUTE COMPONENTS (for reference - pages auto code-split in Next.js)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NOTE: In Next.js App Router, pages are automatically code-split.
 * You don't need to use React.lazy() for pages.
 * 
 * However, if you need to lazy load components within pages, use:
 * 
 * ```tsx
 * // In your page.tsx
 * import dynamic from 'next/dynamic';
 * 
 * const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
 *   loading: () => <Skeleton />,
 * });
 * 
 * // Or use our helper:
 * const HeavyComponent = createLazyComponent(
 *   () => import('@/components/Heavy'),
 *   { fallback: <Skeleton /> }
 * );
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE LAZY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example: Lazy loaded heavy chart component (client-side only)
 * Uncomment and adjust paths as needed:
 * 
 * export const LazyRecruitingChart = lazyChart(
 *   () => import('@/components/charts/RecruitingChart')
 * );
 * 
 * export const LazyPerformanceChart = lazyChart(
 *   () => import('@/components/charts/PerformanceChart')
 * );
 * 
 * export const LazyCalendar = lazyChart(
 *   () => import('@/components/calendar/CalendarView')
 * );
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  dynamic,
  Suspense,
};

export default {
  createLazyComponent,
  lazyChart,
  lazyModal,
  lazyForm,
  lazyTable,
  lazyCardGrid,
  preloadComponent,
  preloadComponents,
  LazyBoundary,
};
