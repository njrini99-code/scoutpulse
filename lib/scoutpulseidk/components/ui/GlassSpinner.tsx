'use client';

import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// Glass Spinner Component
// Elegant loading spinner with glassmorphism design and smooth animations
// ═══════════════════════════════════════════════════════════════════════════

interface GlassSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  label?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeClasses = {
  sm: {
    container: 'w-8 h-8',
    spinner: 'w-6 h-6 border-2',
    dot: 'w-1.5 h-1.5',
    label: 'text-xs mt-2',
  },
  md: {
    container: 'w-12 h-12',
    spinner: 'w-10 h-10 border-[3px]',
    dot: 'w-2 h-2',
    label: 'text-sm mt-3',
  },
  lg: {
    container: 'w-16 h-16',
    spinner: 'w-14 h-14 border-4',
    dot: 'w-2.5 h-2.5',
    label: 'text-base mt-4',
  },
  xl: {
    container: 'w-24 h-24',
    spinner: 'w-20 h-20 border-4',
    dot: 'w-3 h-3',
    label: 'text-lg mt-5',
  },
};

const variantClasses = {
  default: {
    border: 'border-slate-200/40 border-t-emerald-500',
    dot: 'bg-emerald-500',
    label: 'text-slate-600',
    glow: 'shadow-emerald-500/20',
  },
  primary: {
    border: 'border-emerald-200/40 border-t-emerald-600',
    dot: 'bg-emerald-600',
    label: 'text-emerald-700',
    glow: 'shadow-emerald-500/30',
  },
  white: {
    border: 'border-white/20 border-t-white',
    dot: 'bg-white',
    label: 'text-white/90',
    glow: 'shadow-white/20',
  },
};

export function GlassSpinner({
  size = 'md',
  variant = 'default',
  label,
  className,
  fullScreen = false,
  overlay = false,
}: GlassSpinnerProps) {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  const spinnerContent = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Glass Container */}
      <div
        className={cn(
          'relative rounded-2xl flex items-center justify-center',
          'bg-white/10 backdrop-blur-md',
          'shadow-lg shadow-black/5',
          sizeClass.container
        )}
      >
        {/* Spinning Ring */}
        <div
          className={cn(
            'absolute rounded-full animate-spin',
            sizeClass.spinner,
            variantClass.border
          )}
          style={{ animationDuration: '1s' }}
        />
        
        {/* Center Dot with Pulse */}
        <div
          className={cn(
            'rounded-full animate-pulse',
            sizeClass.dot,
            variantClass.dot
          )}
        />

        {/* Glow Effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-50',
            `shadow-lg ${variantClass.glow}`
          )}
        />
      </div>

      {/* Label */}
      {label && (
        <p className={cn('font-medium animate-pulse', sizeClass.label, variantClass.label)}>
          {label}
        </p>
      )}
    </div>
  );

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  // Overlay within container
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// Glass Loading Card
// A card-sized loading state with glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

interface GlassLoadingCardProps {
  message?: string;
  className?: string;
}

export function GlassLoadingCard({ message = 'Loading...', className }: GlassLoadingCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6',
        'bg-white/40 backdrop-blur-md rounded-2xl border border-white/20',
        'shadow-xl shadow-black/5',
        className
      )}
    >
      <GlassSpinner size="lg" variant="primary" />
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Glass Page Loader
// Full page loading state with glassmorphism design
// ═══════════════════════════════════════════════════════════════════════════

interface GlassPageLoaderProps {
  title?: string;
  subtitle?: string;
}

export function GlassPageLoader({ 
  title = 'Loading', 
  subtitle = 'Please wait...' 
}: GlassPageLoaderProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Glass Card */}
        <div className="relative p-8 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/10">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 animate-pulse" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center">
            {/* Multi-ring Spinner */}
            <div className="relative w-20 h-20">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-200/30 border-t-emerald-500 animate-spin" 
                   style={{ animationDuration: '1.2s' }} />
              
              {/* Middle Ring */}
              <div className="absolute inset-2 rounded-full border-[3px] border-slate-200/20 border-t-emerald-400 animate-spin"
                   style={{ animationDuration: '0.9s', animationDirection: 'reverse' }} />
              
              {/* Inner Ring */}
              <div className="absolute inset-4 rounded-full border-2 border-slate-200/10 border-t-emerald-300 animate-spin"
                   style={{ animationDuration: '0.6s' }} />
              
              {/* Center Glow */}
              <div className="absolute inset-6 rounded-full bg-emerald-500/20 animate-pulse" />
              <div className="absolute inset-7 rounded-full bg-emerald-500/40 animate-pulse" 
                   style={{ animationDelay: '0.3s' }} />
            </div>

            {/* Text */}
            <h3 className="mt-6 text-lg font-semibold text-slate-700">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

            {/* Progress Dots */}
            <div className="flex items-center gap-1.5 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline Glass Spinner
// Compact inline spinner for buttons and small spaces
// ═══════════════════════════════════════════════════════════════════════════

interface InlineGlassSpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function InlineGlassSpinner({ size = 'sm', className }: InlineGlassSpinnerProps) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
  };

  return (
    <div
      className={cn(
        'rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export default GlassSpinner;
