'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ProgressVariant = 'default' | 'glass' | 'dark';
export type RatingLevel = 'elite' | 'excellent' | 'good' | 'average' | 'developing' | 'custom';

export interface GlassProgressBarProps {
  /** Current value (0-100 or custom max) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Progress size */
  size?: ProgressSize;
  /** Glass variant */
  variant?: ProgressVariant;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'right' | 'top';
  /** Custom label formatter */
  formatLabel?: (value: number, max: number) => string;
  /** Color based on rating level */
  ratingLevel?: RatingLevel;
  /** Custom color (tailwind class) */
  color?: string;
  /** Animate on mount */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Show glow effect */
  showGlow?: boolean;
  /** Show stripes pattern */
  striped?: boolean;
  /** Animate stripes */
  animatedStripes?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================
// CSS ANIMATIONS
// ============================================

const progressAnimations = `
@keyframes glass-progress-fill {
  from {
    transform: scaleX(0);
  }
}

@keyframes glass-progress-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes glass-progress-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

@keyframes glass-progress-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes glass-progress-spring {
  0% {
    transform: scaleX(0);
  }
  50% {
    transform: scaleX(1.02);
  }
  75% {
    transform: scaleX(0.99);
  }
  100% {
    transform: scaleX(1);
  }
}
`;

let progressStylesInjected = false;
function injectProgressStyles() {
  if (progressStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = progressAnimations;
  document.head.appendChild(style);
  progressStylesInjected = true;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeStyles: Record<ProgressSize, {
  track: string;
  label: string;
  labelInside: string;
  stripeSize: string;
}> = {
  xs: {
    track: 'h-1',
    label: 'text-xs',
    labelInside: 'text-[8px]',
    stripeSize: '0.5rem',
  },
  sm: {
    track: 'h-2',
    label: 'text-xs',
    labelInside: 'text-[10px]',
    stripeSize: '0.75rem',
  },
  md: {
    track: 'h-3',
    label: 'text-sm',
    labelInside: 'text-xs',
    stripeSize: '1rem',
  },
  lg: {
    track: 'h-4',
    label: 'text-sm',
    labelInside: 'text-xs',
    stripeSize: '1.25rem',
  },
  xl: {
    track: 'h-6',
    label: 'text-base',
    labelInside: 'text-sm',
    stripeSize: '1.5rem',
  },
};

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles: Record<ProgressVariant, {
  track: string;
  label: string;
}> = {
  default: {
    track: 'bg-slate-200',
    label: 'text-slate-600',
  },
  glass: {
    track: 'bg-white/10 backdrop-blur-md border border-white/20',
    label: 'text-white',
  },
  dark: {
    track: 'bg-slate-800',
    label: 'text-slate-300',
  },
};

// ============================================
// RATING LEVEL COLORS
// ============================================

const ratingColors: Record<RatingLevel, {
  fill: string;
  glow: string;
  text: string;
}> = {
  elite: {
    fill: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500',
    glow: 'shadow-amber-500/50',
    text: 'text-amber-400',
  },
  excellent: {
    fill: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    glow: 'shadow-emerald-500/50',
    text: 'text-emerald-400',
  },
  good: {
    fill: 'bg-gradient-to-r from-blue-400 to-blue-500',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-400',
  },
  average: {
    fill: 'bg-gradient-to-r from-slate-400 to-slate-500',
    glow: 'shadow-slate-500/50',
    text: 'text-slate-400',
  },
  developing: {
    fill: 'bg-gradient-to-r from-orange-400 to-orange-500',
    glow: 'shadow-orange-500/50',
    text: 'text-orange-400',
  },
  custom: {
    fill: '',
    glow: '',
    text: '',
  },
};

/**
 * Get rating level based on percentage value
 */
function getRatingLevel(percentage: number): RatingLevel {
  if (percentage >= 90) return 'elite';
  if (percentage >= 75) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'average';
  return 'developing';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'glass',
  showLabel = false,
  labelPosition = 'right',
  formatLabel,
  ratingLevel: customRatingLevel,
  color,
  animate = true,
  animationDuration = 600,
  showGlow = false,
  striped = false,
  animatedStripes = false,
  className,
}: GlassProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value);
  const [isVisible, setIsVisible] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const ratingLevel = customRatingLevel || getRatingLevel(percentage);
  const ratingStyle = ratingColors[ratingLevel];

  const sizes = sizeStyles[size];
  const styles = variantStyles[variant];

  // Inject CSS
  useEffect(() => {
    injectProgressStyles();
  }, []);

  // Intersection observer for animate on scroll
  useEffect(() => {
    if (!animate || !progressRef.current) {
      setAnimatedValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(progressRef.current);
    return () => observer.disconnect();
  }, [animate, value]);

  // Animate value with spring physics
  useEffect(() => {
    if (!isVisible) return;

    const startTime = performance.now();
    const startValue = animatedValue;
    const endValue = value;

    const animateSpring = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Spring easing function
      const spring = (t: number) => {
        const tension = 0.5;
        const friction = 0.8;
        return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.pow(1 - t, friction) * Math.cos(t * tension * Math.PI);
      };

      const easedProgress = spring(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setAnimatedValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateSpring);
      }
    };

    requestAnimationFrame(animateSpring);
  }, [isVisible, value, animationDuration]);

  const animatedPercentage = Math.min(100, Math.max(0, (animatedValue / max) * 100));

  const label = formatLabel
    ? formatLabel(value, max)
    : `${Math.round(percentage)}%`;

  const fillColor = color || ratingStyle.fill;
  const glowColor = showGlow && !color ? ratingStyle.glow : '';

  const stripeStyle = striped
    ? {
        backgroundImage: `linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.15) 25%,
          transparent 25%,
          transparent 50%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.15) 75%,
          transparent 75%,
          transparent
        )`,
        backgroundSize: `${sizes.stripeSize} ${sizes.stripeSize}`,
      }
    : {};

  return (
    <div
      ref={progressRef}
      className={cn(
        'w-full',
        labelPosition === 'top' && 'space-y-1',
        className
      )}
    >
      {/* Top label */}
      {showLabel && labelPosition === 'top' && (
        <div className="flex items-center justify-between">
          <span className={cn(sizes.label, styles.label, 'font-medium')}>
            Progress
          </span>
          <span className={cn(sizes.label, ratingStyle.text || styles.label, 'font-semibold')}>
            {label}
          </span>
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-3',
          labelPosition === 'right' && 'flex-row',
          labelPosition === 'inside' && 'relative'
        )}
      >
        {/* Track */}
        <div
          className={cn(
            'relative w-full rounded-full overflow-hidden',
            sizes.track,
            styles.track
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {/* Fill */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-none',
              fillColor,
              showGlow && 'shadow-lg',
              glowColor,
              animatedStripes && 'animate-[glass-progress-stripes_1s_linear_infinite]'
            )}
            style={{
              width: `${animatedPercentage}%`,
              transformOrigin: 'left',
              animation: animate && isVisible
                ? `glass-progress-spring ${animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
                : undefined,
              ...stripeStyle,
            }}
          />

          {/* Shimmer effect */}
          {animate && isVisible && percentage > 0 && (
            <div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{ width: `${animatedPercentage}%` }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'glass-progress-shimmer 1.5s ease-in-out',
                  animationDelay: `${animationDuration}ms`,
                }}
              />
            </div>
          )}

          {/* Inside label */}
          {showLabel && labelPosition === 'inside' && size !== 'xs' && size !== 'sm' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  sizes.labelInside,
                  'font-semibold text-white drop-shadow-sm'
                )}
              >
                {label}
              </span>
            </div>
          )}
        </div>

        {/* Right label */}
        {showLabel && labelPosition === 'right' && (
          <span
            className={cn(
              sizes.label,
              ratingStyle.text || styles.label,
              'font-semibold tabular-nums min-w-[3rem] text-right'
            )}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// SKILL RATING BAR
// ============================================

export interface SkillRatingBarProps {
  /** Skill name */
  name: string;
  /** Current rating (0-100) */
  rating: number;
  /** Previous rating for trend */
  previousRating?: number;
  /** Max rating */
  max?: number;
  /** Show trend indicator */
  showTrend?: boolean;
  /** Size */
  size?: ProgressSize;
  /** Variant */
  variant?: ProgressVariant;
  /** Additional class name */
  className?: string;
}

export function SkillRatingBar({
  name,
  rating,
  previousRating,
  max = 100,
  showTrend = true,
  size = 'md',
  variant = 'glass',
  className,
}: SkillRatingBarProps) {
  const percentage = Math.round((rating / max) * 100);
  const ratingLevel = getRatingLevel(percentage);
  const ratingStyle = ratingColors[ratingLevel];

  const trend = previousRating !== undefined ? rating - previousRating : null;
  const TrendIcon = trend === null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend === null
      ? ''
      : trend > 0
      ? 'text-emerald-400'
      : trend < 0
      ? 'text-red-400'
      : 'text-slate-400';

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('font-medium', sizes.label, styles.label)}>
          {name}
        </span>
        <div className="flex items-center gap-2">
          {showTrend && TrendIcon && trend !== null && (
            <span className={cn('flex items-center gap-0.5 text-xs', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {trend > 0 ? '+' : ''}
              {trend}
            </span>
          )}
          <span className={cn('font-bold tabular-nums', sizes.label, ratingStyle.text)}>
            {rating}
          </span>
        </div>
      </div>
      <GlassProgressBar
        value={rating}
        max={max}
        size={size}
        variant={variant}
        ratingLevel={ratingLevel}
        showGlow
      />
    </div>
  );
}

// ============================================
// SKILL RADAR (Multiple skills)
// ============================================

export interface SkillData {
  name: string;
  rating: number;
  previousRating?: number;
  max?: number;
}

export interface SkillRatingGroupProps {
  /** Group title */
  title?: string;
  /** Skills data */
  skills: SkillData[];
  /** Show trends */
  showTrends?: boolean;
  /** Size */
  size?: ProgressSize;
  /** Variant */
  variant?: ProgressVariant;
  /** Additional class name */
  className?: string;
}

export function SkillRatingGroup({
  title,
  skills,
  showTrends = true,
  size = 'md',
  variant = 'glass',
  className,
}: SkillRatingGroupProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className}>
      {title && (
        <h3 className={cn('text-lg font-semibold mb-4', styles.label)}>
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {skills.map((skill) => (
          <SkillRatingBar
            key={skill.name}
            name={skill.name}
            rating={skill.rating}
            previousRating={skill.previousRating}
            max={skill.max}
            showTrend={showTrends}
            size={size}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CIRCULAR PROGRESS
// ============================================

export interface CircularProgressProps {
  /** Value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Rating level */
  ratingLevel?: RatingLevel;
  /** Custom color */
  color?: string;
  /** Variant */
  variant?: ProgressVariant;
  /** Animate */
  animate?: boolean;
  /** Additional class name */
  className?: string;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  label,
  ratingLevel: customRatingLevel,
  color,
  variant = 'glass',
  animate = true,
  className,
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value);

  const percentage = Math.min(100, Math.max(0, value));
  const ratingLevel = customRatingLevel || getRatingLevel(percentage);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const styles = variantStyles[variant];

  // Gradient colors based on rating
  const gradientColors: Record<RatingLevel, { start: string; end: string }> = {
    elite: { start: '#fbbf24', end: '#f59e0b' },
    excellent: { start: '#34d399', end: '#10b981' },
    good: { start: '#60a5fa', end: '#3b82f6' },
    average: { start: '#94a3b8', end: '#64748b' },
    developing: { start: '#fb923c', end: '#f97316' },
    custom: { start: '#10b981', end: '#059669' },
  };

  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(value);
      return;
    }

    const startTime = performance.now();
    const startValue = animatedValue;
    const duration = 800;

    const animateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [value, animate]);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[ratingLevel].start} />
            <stop offset="100%" stopColor={gradientColors[ratingLevel].end} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variant === 'glass' ? 'rgba(255,255,255,0.1)' : variant === 'dark' ? '#1e293b' : '#e2e8f0'}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color || `url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))',
          }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', styles.label, size >= 80 ? 'text-xl' : 'text-base')}>
            {label || `${Math.round(animatedValue)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// PROGRESS STEPS
// ============================================

export interface ProgressStep {
  label: string;
  completed: boolean;
  current?: boolean;
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  variant?: ProgressVariant;
  className?: string;
}

export function ProgressSteps({
  steps,
  variant = 'glass',
  className,
}: ProgressStepsProps) {
  const styles = variantStyles[variant];
  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = (completedCount / steps.length) * 100;

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="relative mb-4">
        <GlassProgressBar
          value={percentage}
          variant={variant}
          size="sm"
          showGlow
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={cn(
              'flex flex-col items-center',
              index === 0 && 'items-start',
              index === steps.length - 1 && 'items-end'
            )}
          >
            <div
              className={cn(
                'h-3 w-3 rounded-full mb-2 transition-colors',
                step.completed
                  ? 'bg-emerald-500'
                  : step.current
                  ? 'bg-blue-500 animate-pulse'
                  : variant === 'glass'
                  ? 'bg-white/20'
                  : 'bg-slate-300'
              )}
            />
            <span
              className={cn(
                'text-xs',
                step.completed || step.current ? styles.label : 'text-slate-500'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MULTI-PROGRESS BAR
// ============================================

export interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

export interface MultiProgressBarProps {
  segments: ProgressSegment[];
  max?: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showLegend?: boolean;
  className?: string;
}

export function MultiProgressBar({
  segments,
  max = 100,
  size = 'md',
  variant = 'glass',
  showLegend = true,
  className,
}: MultiProgressBarProps) {
  const sizes = sizeStyles[size];
  const styles = variantStyles[variant];

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Bar */}
      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden flex',
          sizes.track,
          styles.track
        )}
      >
        {segments.map((segment, index) => {
          const width = (segment.value / max) * 100;
          return (
            <div
              key={index}
              className={cn('h-full transition-all duration-500', segment.color)}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', segment.color)} />
              <span className={cn('text-sm', styles.label)}>
                {segment.label || `Segment ${index + 1}`}
              </span>
              <span className={cn('text-sm font-medium', styles.label)}>
                {segment.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GlassProgressBar;
