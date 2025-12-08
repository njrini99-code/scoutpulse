'use client';

import { useState, useCallback, ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TRANSITION_DURATION = 300; // 300ms for consistency
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design easing

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ripple?: boolean;
}

export function AnimatedButton({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  ripple = true,
  className,
  onClick,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && !disabled && !loading) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  }, [onClick, ripple, disabled, loading]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };

  const variantClasses = {
    default: 'bg-white/10 hover:bg-white/20 border border-white/20',
    primary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
    secondary: 'bg-slate-700 hover:bg-slate-600',
    ghost: 'hover:bg-white/10',
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium text-white',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'min-w-[44px]', // Minimum touch target width
        sizeClasses[size],
        variantClasses[variant],
        isPressed && 'scale-95',
        !isPressed && !disabled && 'hover:scale-105 active:scale-95',
        loading && 'cursor-wait',
        className
      )}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: EASING,
      }}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </span>
      )}
      <span className={cn(loading && 'opacity-0')}>{children}</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM INPUT MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export function AnimatedInput({
  label,
  error,
  success,
  className,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value || props.defaultValue);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg bg-white/5 border text-white placeholder-gray-500',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2',
            isFocused && !error && !success && 'border-emerald-500/50 ring-emerald-500/30',
            error && 'border-red-500/50 ring-red-500/30',
            success && 'border-emerald-500/50 ring-emerald-500/30',
            !isFocused && !error && !success && 'border-white/10',
            className
          )}
          style={{
            transitionDuration: `${TRANSITION_DURATION}ms`,
            transitionTimingFunction: EASING,
          }}
        />
        {isFocused && (
          <div
            className="absolute inset-0 rounded-lg border-2 border-emerald-500/50 pointer-events-none animate-input-focus"
            style={{
              animationDuration: `${TRANSITION_DURATION}ms`,
            }}
          />
        )}
      </div>
      {error && (
        <p className="text-red-400 text-sm animate-error-slide">{error}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION LINK MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
}

export function AnimatedLink({
  href,
  children,
  className,
  active = false,
}: AnimatedLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative inline-block text-gray-400 hover:text-white',
        'transition-colors duration-300',
        active && 'text-emerald-400',
        className
      )}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: EASING,
      }}
    >
      {children}
      <span
        className={cn(
          'absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-300',
          isHovered || active ? 'w-full' : 'w-0'
        )}
        style={{
          transitionDuration: `${TRANSITION_DURATION}ms`,
          transitionTimingFunction: EASING,
        }}
      />
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  onClick,
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'rounded-xl bg-white/5 border border-white/10 p-4',
        'transition-all duration-300',
        hover && isHovered && 'bg-white/10 border-white/20 scale-[1.02] shadow-lg',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: EASING,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL ANIMATION STYLES
// ═══════════════════════════════════════════════════════════════════════════

if (typeof document !== 'undefined') {
  const styleId = 'micro-interactions-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes ripple {
        0% {
          width: 0;
          height: 0;
          opacity: 1;
        }
        100% {
          width: 200px;
          height: 200px;
          opacity: 0;
        }
      }

      @keyframes input-focus {
        0% {
          opacity: 0;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes error-slide {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .animate-ripple {
        animation: ripple ${TRANSITION_DURATION * 2}ms ease-out;
      }

      .animate-input-focus {
        animation: input-focus ${TRANSITION_DURATION}ms ${EASING};
      }

      .animate-error-slide {
        animation: error-slide ${TRANSITION_DURATION}ms ${EASING};
      }
    `;
    document.head.appendChild(style);
  }
}
