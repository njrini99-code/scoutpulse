'use client';

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type GlassInputSize = 'sm' | 'md' | 'lg';
export type GlassInputVariant = 'default' | 'subtle' | 'solid';
export type ValidationState = 'default' | 'error' | 'success' | 'warning';

export interface GlassInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: GlassInputSize;
  /** Visual variant */
  variant?: GlassInputVariant;
  /** Left icon/element */
  leftIcon?: ReactNode;
  /** Right icon/element */
  rightIcon?: ReactNode;
  /** Show clear button */
  clearable?: boolean;
  /** Clear button callback */
  onClear?: () => void;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Validation state */
  validationState?: ValidationState;
  /** Disable focus animation */
  disableAnimation?: boolean;
  /** Custom focus scale (default: 1.02) */
  focusScale?: number;
  /** Full width */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
}

export interface GlassTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Size variant */
  size?: GlassInputSize;
  /** Visual variant */
  variant?: GlassInputVariant;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Validation state */
  validationState?: ValidationState;
  /** Disable focus animation */
  disableAnimation?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
  /** Auto-resize based on content */
  autoResize?: boolean;
  /** Minimum rows */
  minRows?: number;
  /** Maximum rows */
  maxRows?: number;
}

export interface GlassSearchInputProps extends Omit<GlassInputProps, 'leftIcon'> {
  /** Search callback (debounced internally if specified) */
  onSearch?: (value: string) => void;
  /** Loading state */
  loading?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_STYLES: Record<GlassInputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const TEXTAREA_SIZE_STYLES: Record<GlassInputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const ICON_SIZE_STYLES: Record<GlassInputSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const VARIANT_STYLES: Record<GlassInputVariant, string> = {
  default: 'bg-white/10 border-white/15',
  subtle: 'bg-white/5 border-white/10',
  solid: 'bg-slate-800/80 border-slate-700/50',
};

const VALIDATION_STYLES: Record<ValidationState, string> = {
  default: 'focus:ring-blue-500/50 focus:border-blue-500/50',
  error: 'ring-red-500/50 border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
  success: 'ring-emerald-500/50 border-emerald-500/50 focus:ring-emerald-500/50 focus:border-emerald-500/50',
  warning: 'ring-amber-500/50 border-amber-500/50 focus:ring-amber-500/50 focus:border-amber-500/50',
};

const VALIDATION_ICON_COLORS: Record<ValidationState, string> = {
  default: 'text-slate-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
};

// ═══════════════════════════════════════════════════════════════════════════
// GLASS INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      type = 'text',
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      label,
      helperText,
      error,
      success,
      validationState: propValidationState,
      disableAnimation = false,
      focusScale = 1.02,
      fullWidth = false,
      containerClassName,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Determine validation state
    const validationState: ValidationState = propValidationState
      ? propValidationState
      : error
      ? 'error'
      : success
      ? 'success'
      : 'default';

    // Determine if clearable should show
    const showClearButton = clearable && value && String(value).length > 0;

    // Determine actual input type (for password toggle)
    const actualType = type === 'password' && showPassword ? 'text' : type;

    // Focus animation styles
    const focusAnimationStyle = !disableAnimation
      ? {
          '--focus-scale': focusScale,
        } as React.CSSProperties
      : {};

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}

        {/* Input Wrapper */}
        <div
          className={cn(
            'relative flex items-center',
            fullWidth && 'w-full'
          )}
          style={focusAnimationStyle}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              'absolute left-3 flex items-center justify-center pointer-events-none',
              ICON_SIZE_STYLES[size],
              'text-white/60'
            )}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={actualType}
            disabled={disabled}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              // Base styles
              'w-full rounded-xl border outline-none',
              'backdrop-blur-xl',
              'text-white placeholder:text-white/60',
              // Size
              SIZE_STYLES[size],
              // Variant
              VARIANT_STYLES[variant],
              // Focus ring
              'focus:ring-2',
              VALIDATION_STYLES[validationState],
              // Animation
              !disableAnimation && [
                'transition-all duration-200 ease-out',
                'focus:scale-[var(--focus-scale,1.02)]',
              ],
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              // Icon padding
              leftIcon && 'pl-10',
              (rightIcon || showClearButton || type === 'password') && 'pr-10',
              // Custom
              className
            )}
            style={focusAnimationStyle}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-3 flex items-center gap-2">
            {/* Clear Button */}
            {showClearButton && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  'flex items-center justify-center rounded-full p-0.5',
                  'text-white/60 hover:text-white hover:bg-white/10',
                  'transition-colors duration-150',
                  ICON_SIZE_STYLES[size]
                )}
              >
                <X className="w-full h-full" />
              </button>
            )}

            {/* Password Toggle */}
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'flex items-center justify-center',
                  'text-white/60 hover:text-white',
                  'transition-colors duration-150',
                  ICON_SIZE_STYLES[size]
                )}
              >
                {showPassword ? (
                  <EyeOff className="w-full h-full" />
                ) : (
                  <Eye className="w-full h-full" />
                )}
              </button>
            )}

            {/* Validation Icon */}
            {validationState !== 'default' && !rightIcon && (
              <div className={cn(ICON_SIZE_STYLES[size], VALIDATION_ICON_COLORS[validationState])}>
                {validationState === 'error' && <AlertCircle className="w-full h-full" />}
                {validationState === 'success' && <CheckCircle2 className="w-full h-full" />}
                {validationState === 'warning' && <AlertCircle className="w-full h-full" />}
              </div>
            )}

            {/* Custom Right Icon */}
            {rightIcon && (
              <div className={cn(ICON_SIZE_STYLES[size], 'text-white/60')}>
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper/Error/Success Text */}
        {(helperText || error || success) && (
          <p className={cn(
            'text-xs',
            error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-400'
          )}>
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

// ═══════════════════════════════════════════════════════════════════════════
// GLASS TEXTAREA COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      label,
      helperText,
      error,
      success,
      validationState: propValidationState,
      disableAnimation = false,
      fullWidth = false,
      containerClassName,
      disabled,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Determine validation state
    const validationState: ValidationState = propValidationState
      ? propValidationState
      : error
      ? 'error'
      : success
      ? 'success'
      : 'default';

    // Auto-resize handler
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const target = e.currentTarget;
        target.style.height = 'auto';
        const lineHeight = parseInt(getComputedStyle(target).lineHeight) || 24;
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        const newHeight = Math.min(Math.max(target.scrollHeight, minHeight), maxHeight);
        target.style.height = `${newHeight}px`;
      }
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          disabled={disabled}
          rows={minRows}
          onInput={handleInput}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            // Base styles
            'w-full rounded-xl border outline-none resize-none',
            'backdrop-blur-xl',
            'text-white placeholder:text-white/60',
            // Size
            TEXTAREA_SIZE_STYLES[size],
            // Variant
            VARIANT_STYLES[variant],
            // Focus ring
            'focus:ring-2',
            VALIDATION_STYLES[validationState],
            // Animation
            !disableAnimation && [
              'transition-all duration-200 ease-out',
              'focus:scale-[1.01]',
            ],
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed',
            // Custom
            className
          )}
          {...props}
        />

        {/* Helper/Error/Success Text */}
        {(helperText || error || success) && (
          <p className={cn(
            'text-xs',
            error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-400'
          )}>
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';

// ═══════════════════════════════════════════════════════════════════════════
// GLASS SEARCH INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const GlassSearchInput = forwardRef<HTMLInputElement, GlassSearchInputProps>(
  (
    {
      className,
      onSearch,
      loading = false,
      placeholder = 'Search...',
      clearable = true,
      ...props
    },
    ref
  ) => {
    return (
      <GlassInput
        ref={ref}
        type="search"
        placeholder={placeholder}
        clearable={clearable}
        leftIcon={
          loading ? (
            <div className="animate-spin">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <Search />
          )
        }
        className={className}
        onChange={(e) => {
          props.onChange?.(e);
          onSearch?.(e.target.value);
        }}
        {...props}
      />
    );
  }
);

GlassSearchInput.displayName = 'GlassSearchInput';

// ═══════════════════════════════════════════════════════════════════════════
// GLASS INPUT GROUP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassInputGroupProps {
  children: ReactNode;
  className?: string;
}

export function GlassInputGroup({ children, className }: GlassInputGroupProps) {
  return (
    <div className={cn('flex', className)}>
      {children}
    </div>
  );
}

export interface GlassInputAddonProps {
  children: ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function GlassInputAddon({
  children,
  className,
  position = 'left',
}: GlassInputAddonProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center px-4',
        'bg-white/5 border border-white/15 text-white/60',
        'backdrop-blur-xl',
        position === 'left' && 'rounded-l-xl border-r-0',
        position === 'right' && 'rounded-r-xl border-l-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS SELECT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface GlassSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: GlassInputSize;
  variant?: GlassInputVariant;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  containerClassName?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      label,
      helperText,
      error,
      fullWidth = false,
      containerClassName,
      disabled,
      options,
      placeholder,
      ...props
    },
    ref
  ) => {
    const validationState: ValidationState = error ? 'error' : 'default';

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}

        {/* Select */}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-xl border outline-none appearance-none cursor-pointer',
              'backdrop-blur-xl',
              'text-white',
              // Size
              SIZE_STYLES[size],
              'pr-10', // Space for arrow
              // Variant
              VARIANT_STYLES[variant],
              // Focus ring
              'focus:ring-2',
              VALIDATION_STYLES[validationState],
              // Animation
              'transition-all duration-200 ease-out',
              'focus:scale-[1.02]',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              // Custom
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400 bg-slate-800">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-slate-800 text-white"
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
            <svg
              className={ICON_SIZE_STYLES[size]}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Helper/Error Text */}
        {(helperText || error) && (
          <p className={cn('text-xs', error ? 'text-red-400' : 'text-slate-400')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default GlassInput;
