'use client';

import { forwardRef, ReactNode, HTMLAttributes, useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, User, type LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const glassCardStyles = `
/* Hover elevation animations */
@keyframes card-elevate {
  0% {
    transform: translateY(0) scale(1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
  100% {
    transform: translateY(var(--hover-y, -4px)) scale(var(--hover-scale, 1.02));
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
}

/* Ripple effect */
@keyframes ripple-expand {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  animation: ripple-expand 0.6s ease-out forwards;
}

/* Loading skeleton shimmer */
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
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Loading overlay pulse */
@keyframes loading-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
}

.loading-overlay {
  animation: loading-pulse 1.5s ease-in-out infinite;
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

/* Tooltip animations */
@keyframes tooltip-fade-in {
  0% {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes tooltip-fade-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
}

.tooltip-enter {
  animation: tooltip-fade-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.tooltip-exit {
  animation: tooltip-fade-out 0.15s ease-out forwards;
}

/* Image fade in */
@keyframes image-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.image-loaded {
  animation: image-fade-in 0.3s ease-out;
}

/* Retry button pulse */
@keyframes retry-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.retry-button:hover {
  animation: retry-pulse 0.5s ease-in-out infinite;
}
`;

let stylesInjected = false;
function injectGlassCardStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'glass-card-styles';
  style.textContent = glassCardStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type GlassCardSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type GlassCardVariant = 'default' | 'subtle' | 'solid' | 'gradient' | 'glow';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: GlassCardSize;
  variant?: GlassCardVariant;
  disableHover?: boolean;
  hoverScale?: number;
  hoverY?: number;
  clickable?: boolean;
  glass?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'none';
  header?: ReactNode;
  footer?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Custom loading content */
  loadingContent?: ReactNode;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Enable ripple effect on click */
  enableRipple?: boolean;
  glowColor?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_STYLES: Record<GlassCardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  full: 'p-0',
};

const VARIANT_STYLES: Record<GlassCardVariant, string> = {
  default: 'bg-white/10 border-white/15',
  subtle: 'bg-white/5 border-white/10',
  solid: 'bg-slate-800/80 border-slate-700/50',
  gradient: 'bg-gradient-to-br from-white/15 to-white/5 border-white/20',
  glow: 'bg-white/10 border-white/20',
};

const ROUNDED_STYLES: Record<string, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
  none: 'rounded-none',
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

function LoadingSkeleton({ rows = 3, showAvatar = false, showImage = false }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {showAvatar && (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-1/2" />
            <div className="h-3 skeleton-shimmer rounded w-1/3" />
          </div>
        </div>
      )}
      {showImage && (
        <div className="h-40 skeleton-shimmer rounded-lg" />
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 skeleton-shimmer rounded"
          style={{ width: `${Math.max(40, 100 - i * 20)}%` }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingOverlayProps {
  message?: string;
}

function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm loading-overlay rounded-xl">
      <div className="relative">
        <div className="w-10 h-10 border-3 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
      <p className="mt-3 text-sm text-white/70">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center error-shake">
      <div className="p-3 rounded-xl bg-red-500/20 mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <p className="text-white font-medium mb-2">Error</p>
      <p className="text-slate-400 text-sm mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 retry-button"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

function useRipple(enabled: boolean) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  }, [enabled]);

  return { ripples, createRipple, containerRef };
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className,
      size = 'md',
      variant = 'default',
      disableHover = false,
      hoverScale = 1.02,
      hoverY = -4,
      clickable = false,
      glass = true,
      rounded = 'xl',
      header,
      footer,
      loading = false,
      loadingContent,
      error = false,
      errorMessage,
      onRetry,
      enableRipple = false,
      glowColor,
      style,
      onMouseDown,
      onMouseUp,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const { ripples, createRipple, containerRef } = useRipple(enableRipple && clickable);

    // Inject styles
    useEffect(() => {
      injectGlassCardStyles();
    }, []);

    // Build dynamic hover styles
    const hoverStyles = !disableHover
      ? {
          '--hover-scale': hoverScale,
          '--hover-y': `${hoverY}px`,
        } as React.CSSProperties
      : {};

    // Build glow style for 'glow' variant
    const glowStyles = variant === 'glow' && glowColor
      ? {
          boxShadow: `0 0 40px ${glowColor}20, 0 0 80px ${glowColor}10`,
        }
      : {};

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickable) setIsPressed(true);
      createRipple(e);
      onMouseDown?.(e);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickable) setIsPressed(false);
      onMouseUp?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
    };

    return (
      <div
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          // Base styles
          'relative overflow-hidden border shadow-xl',
          // Glassmorphism
          glass && 'backdrop-blur-xl',
          // Size
          SIZE_STYLES[size],
          // Variant
          VARIANT_STYLES[variant],
          // Rounded
          ROUNDED_STYLES[rounded],
          // Interactive
          clickable && 'cursor-pointer select-none',
          // Hover animations
          !disableHover && !error && [
            'transition-all duration-300',
            'hover:scale-[var(--hover-scale,1.02)]',
            'hover:translate-y-[var(--hover-y,-4px)]',
            'hover:shadow-2xl hover:shadow-black/25',
            'hover:border-white/25',
          ],
          // Click animation
          clickable && isPressed && 'scale-[0.98]',
          // Error state
          error && 'border-red-500/50',
          // Custom
          className
        )}
        style={{
          ...style,
          ...hoverStyles,
          ...glowStyles,
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPressed(false)}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}

        {/* Glow Effect Overlay */}
        {variant === 'glow' && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-50"
            style={{
              background: glowColor
                ? `radial-gradient(ellipse at center, ${glowColor}40 0%, transparent 70%)`
                : 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Header */}
        {header && !error && (
          <div className={cn(
            'border-b border-white/10 pb-4 mb-4',
            size === 'sm' && 'pb-3 mb-3',
            size === 'lg' && 'pb-6 mb-6',
            size === 'xl' && 'pb-6 mb-6'
          )}>
            {header}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {error ? (
            <ErrorState message={errorMessage} onRetry={onRetry} />
          ) : loading ? (
            loadingContent || <LoadingSkeleton />
          ) : (
            children
          )}
        </div>

        {/* Loading Overlay */}
        {loading && !error && loadingContent === undefined && (
          <LoadingOverlay />
        )}

        {/* Footer */}
        {footer && !error && (
          <div className={cn(
            'border-t border-white/10 pt-4 mt-4',
            size === 'sm' && 'pt-3 mt-3',
            size === 'lg' && 'pt-6 mt-6',
            size === 'xl' && 'pt-6 mt-6'
          )}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ═══════════════════════════════════════════════════════════════════════════
// GLASS IMAGE COMPONENT (with error handling and fallback)
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassImageProps {
  src: string;
  alt: string;
  fallback?: ReactNode;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

export function GlassImage({
  src,
  alt,
  fallback,
  fallbackSrc,
  className,
  containerClassName,
  aspectRatio = 'auto',
  onLoad,
  onError,
}: GlassImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setStatus('loading');
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setStatus('loaded');
    onLoad?.();
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setStatus('error');
      onError?.();
    }
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-white/5 rounded-lg',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}

      {/* Error State with Fallback */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          {fallback || (
            <div className="p-4 rounded-xl bg-white/10">
              <User className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {status !== 'error' && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            status === 'loading' ? 'opacity-0' : 'opacity-100 image-loaded',
            className
          )}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TooltipProps {
  content: ReactNode;
  description?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  description,
  children,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    injectGlassCardStyles();
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsExiting(false);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 150);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 rounded-lg shadow-xl pointer-events-none',
            'bg-slate-800/95 backdrop-blur-md border border-white/10',
            'max-w-xs',
            positionClasses[position],
            isExiting ? 'tooltip-exit' : 'tooltip-enter',
            className
          )}
        >
          <div className="text-sm font-medium text-white whitespace-nowrap">
            {content}
          </div>
          {description && (
            <div className="text-xs text-slate-400 mt-0.5">
              {description}
            </div>
          )}
          {/* Arrow */}
          <div 
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassCardHeaderProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function GlassCardHeader({
  children,
  className,
  title,
  subtitle,
  icon,
  action,
}: GlassCardHeaderProps) {
  if (title || subtitle || icon || action) {
    return (
      <div className={cn('flex items-center justify-between gap-4', className)}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-white/10 shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className="font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD CONTENT & FOOTER
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassCardContentProps {
  children: ReactNode;
  className?: string;
}

export function GlassCardContent({ children, className }: GlassCardContentProps) {
  return <div className={cn('text-slate-300', className)}>{children}</div>;
}

export interface GlassCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function GlassCardFooter({ children, className }: GlassCardFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD GROUP
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassCardGroupProps {
  children: ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

const GAP_STYLES = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function GlassCardGroup({
  children,
  className,
  direction = 'vertical',
  gap = 'md',
}: GlassCardGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
        GAP_STYLES[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD WITH TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassStatCardProps extends Omit<GlassCardProps, 'children'> {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  valueColor?: string;
  /** Tooltip description for the stat */
  description?: string;
}

export function GlassStatCard({
  value,
  label,
  icon,
  trend,
  valueColor,
  description,
  className,
  ...props
}: GlassStatCardProps) {
  const content = (
    <GlassCard className={cn('min-w-[140px]', className)} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={cn('text-2xl font-bold', valueColor || 'text-white')}>
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1 flex items-center gap-1',
                trend.direction === 'up' && 'text-emerald-400',
                trend.direction === 'down' && 'text-red-400',
                trend.direction === 'neutral' && 'text-slate-400'
              )}
            >
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.value}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/10">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );

  if (description) {
    return (
      <Tooltip content={label} description={description}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE CARD
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassFeatureCardProps extends Omit<GlassCardProps, 'children'> {
  title: string;
  description: string;
  icon: ReactNode;
  iconColor?: string;
}

export function GlassFeatureCard({
  title,
  description,
  icon,
  iconColor,
  className,
  ...props
}: GlassFeatureCardProps) {
  return (
    <GlassCard
      className={cn('text-center', className)}
      clickable
      enableRipple
      {...props}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4',
          iconColor || 'bg-emerald-500/20 text-emerald-400'
        )}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION CARD
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassActionCardProps extends Omit<GlassCardProps, 'children'> {
  title: string;
  description?: string;
  icon: ReactNode;
  iconBg?: string;
  chevron?: boolean;
}

export function GlassActionCard({
  title,
  description,
  icon,
  iconBg,
  chevron = true,
  className,
  ...props
}: GlassActionCardProps) {
  return (
    <GlassCard
      className={cn('', className)}
      clickable
      enableRipple
      {...props}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            iconBg || 'bg-white/10'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{title}</h4>
          {description && (
            <p className="text-sm text-slate-400 truncate">{description}</p>
          )}
        </div>
        {chevron && (
          <svg
            className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA CARD (with image error handling)
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassMediaCardProps extends Omit<GlassCardProps, 'children'> {
  title: string;
  subtitle?: string;
  imageSrc: string;
  imageAlt?: string;
  fallbackImage?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  badge?: ReactNode;
}

export function GlassMediaCard({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  fallbackImage,
  aspectRatio = 'video',
  badge,
  className,
  ...props
}: GlassMediaCardProps) {
  return (
    <GlassCard
      className={cn('overflow-hidden', className)}
      size="full"
      clickable
      enableRipple
      {...props}
    >
      <div className="relative">
        <GlassImage
          src={imageSrc}
          alt={imageAlt || title}
          fallbackSrc={fallbackImage}
          aspectRatio={aspectRatio}
        />
        {badge && (
          <div className="absolute top-2 right-2">
            {badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-white truncate">{title}</h4>
        {subtitle && (
          <p className="text-sm text-slate-400 truncate mt-1">{subtitle}</p>
        )}
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default GlassCard;
