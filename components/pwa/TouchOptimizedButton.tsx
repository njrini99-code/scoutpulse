'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MIN_TOUCH_TARGET } from '@/lib/pwa/touchTargets';

interface TouchOptimizedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function TouchOptimizedButton({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: TouchOptimizedButtonProps) {
  const sizeClasses = {
    sm: `h-[${MIN_TOUCH_TARGET}px] px-4 text-sm`,
    md: `h-[${MIN_TOUCH_TARGET + 4}px] px-6 text-base`,
    lg: `h-[${MIN_TOUCH_TARGET + 8}px] px-8 text-lg`,
  };

  const variantClasses = {
    default: 'bg-white/10 hover:bg-white/20 border border-white/20',
    primary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'hover:bg-white/10 text-white',
  };

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{
        minHeight: `${MIN_TOUCH_TARGET}px`,
        minWidth: `${MIN_TOUCH_TARGET}px`,
      }}
    >
      {children}
    </button>
  );
}
