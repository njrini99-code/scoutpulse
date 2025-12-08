'use client';

import React, { useId, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, type LucideIcon } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleVariant = 'default' | 'glass' | 'dark';

export interface GlassToggleProps {
  /** Controlled checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Toggle size */
  size?: ToggleSize;
  /** Glass variant */
  variant?: ToggleVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Show icons in thumb */
  showIcons?: boolean;
  /** Custom on icon */
  onIcon?: LucideIcon;
  /** Custom off icon */
  offIcon?: LucideIcon;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Accessible name (required if no label) */
  'aria-label'?: string;
  /** ID for the input */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** Additional class name */
  className?: string;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeStyles: Record<ToggleSize, {
  track: string;
  thumb: string;
  thumbTranslate: string;
  icon: string;
  label: string;
  description: string;
  gap: string;
}> = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    thumbTranslate: 'translate-x-4',
    icon: 'h-2.5 w-2.5',
    label: 'text-sm',
    description: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    thumbTranslate: 'translate-x-5',
    icon: 'h-3 w-3',
    label: 'text-sm',
    description: 'text-xs',
    gap: 'gap-3',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    thumbTranslate: 'translate-x-7',
    icon: 'h-3.5 w-3.5',
    label: 'text-base',
    description: 'text-sm',
    gap: 'gap-3',
  },
};

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles: Record<ToggleVariant, {
  trackOff: string;
  trackOn: string;
  trackDisabled: string;
  thumb: string;
  thumbShadow: string;
  label: string;
  description: string;
}> = {
  default: {
    trackOff: 'bg-slate-200',
    trackOn: 'bg-emerald-500',
    trackDisabled: 'bg-slate-100',
    thumb: 'bg-white',
    thumbShadow: 'shadow-md',
    label: 'text-slate-900',
    description: 'text-slate-500',
  },
  glass: {
    trackOff: 'bg-white/10 backdrop-blur-md border border-white/20',
    trackOn: 'bg-emerald-500/80 backdrop-blur-md border border-emerald-400/30',
    trackDisabled: 'bg-white/5 border border-white/10',
    thumb: 'bg-white/90 backdrop-blur-sm',
    thumbShadow: 'shadow-lg shadow-black/20',
    label: 'text-white',
    description: 'text-white/60',
  },
  dark: {
    trackOff: 'bg-slate-700',
    trackOn: 'bg-emerald-500',
    trackDisabled: 'bg-slate-800',
    thumb: 'bg-slate-200',
    thumbShadow: 'shadow-md',
    label: 'text-slate-100',
    description: 'text-slate-400',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassToggle({
  checked,
  onChange,
  size = 'md',
  variant = 'glass',
  disabled = false,
  showIcons = false,
  onIcon: OnIcon = Check,
  offIcon: OffIcon = X,
  label,
  description,
  labelPosition = 'right',
  'aria-label': ariaLabel,
  id: providedId,
  name,
  className,
}: GlassToggleProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = description ? `${id}-description` : undefined;

  const sizes = sizeStyles[size];
  const styles = variantStyles[variant];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const toggle = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={!label ? ariaLabel : undefined}
      aria-describedby={descriptionId}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        variant === 'glass' && 'focus-visible:ring-offset-slate-900',
        sizes.track,
        checked ? styles.trackOn : styles.trackOff,
        disabled && styles.trackDisabled,
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {/* Thumb */}
      <span
        className={cn(
          'pointer-events-none inline-flex items-center justify-center rounded-full transition-transform duration-200 ease-in-out',
          sizes.thumb,
          styles.thumb,
          styles.thumbShadow,
          'translate-x-0.5',
          checked && sizes.thumbTranslate
        )}
      >
        {/* Icons */}
        {showIcons && (
          <>
            <OnIcon
              className={cn(
                sizes.icon,
                'text-emerald-500 transition-opacity duration-150',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            />
            <OffIcon
              className={cn(
                sizes.icon,
                'absolute text-slate-400 transition-opacity duration-150',
                checked ? 'opacity-0' : 'opacity-100'
              )}
            />
          </>
        )}
      </span>

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={checked ? 'true' : 'false'}
        />
      )}
    </button>
  );

  // If no label, return just the toggle
  if (!label) {
    return toggle;
  }

  // With label
  return (
    <div
      className={cn(
        'inline-flex items-start',
        sizes.gap,
        labelPosition === 'left' && 'flex-row-reverse',
        className
      )}
    >
      {toggle}
      <div className="flex flex-col">
        <label
          htmlFor={id}
          className={cn(
            'font-medium cursor-pointer select-none',
            sizes.label,
            styles.label,
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {label}
        </label>
        {description && (
          <span
            id={descriptionId}
            className={cn(
              sizes.description,
              styles.description,
              'mt-0.5'
            )}
          >
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// TOGGLE GROUP
// ============================================

export interface ToggleGroupItem {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
}

export interface GlassToggleGroupProps {
  /** Group label */
  label?: string;
  /** Toggle items */
  items: ToggleGroupItem[];
  /** Change handler */
  onChange: (id: string, checked: boolean) => void;
  /** Toggle size */
  size?: ToggleSize;
  /** Glass variant */
  variant?: ToggleVariant;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Additional class name */
  className?: string;
}

export function GlassToggleGroup({
  label,
  items,
  onChange,
  size = 'md',
  variant = 'glass',
  direction = 'vertical',
  className,
}: GlassToggleGroupProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className} role="group" aria-label={label}>
      {label && (
        <div
          className={cn(
            'font-semibold mb-3',
            size === 'sm' ? 'text-sm' : 'text-base',
            styles.label
          )}
        >
          {label}
        </div>
      )}
      <div
        className={cn(
          'flex',
          direction === 'vertical' ? 'flex-col gap-4' : 'flex-row flex-wrap gap-6'
        )}
      >
        {items.map((item) => (
          <GlassToggle
            key={item.id}
            checked={item.checked}
            onChange={(checked) => onChange(item.id, checked)}
            label={item.label}
            description={item.description}
            disabled={item.disabled}
            size={size}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// SETTINGS TOGGLE
// ============================================

export interface SettingsToggleProps {
  /** Setting title */
  title: string;
  /** Setting description */
  description?: string;
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Icon */
  icon?: LucideIcon;
  /** Glass variant */
  variant?: ToggleVariant;
  /** Additional class name */
  className?: string;
}

export function SettingsToggle({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  icon: Icon,
  variant = 'glass',
  className,
}: SettingsToggleProps) {
  const id = useId();
  const styles = variantStyles[variant];

  const containerStyles = {
    default: 'bg-white border border-slate-200 hover:border-slate-300',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10',
    dark: 'bg-slate-800 border border-slate-700 hover:border-slate-600',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 rounded-xl transition-colors',
        containerStyles[variant],
        disabled && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div
            className={cn(
              'shrink-0 p-2 rounded-lg',
              variant === 'default'
                ? 'bg-slate-100 text-slate-600'
                : variant === 'glass'
                ? 'bg-white/10 text-white/80'
                : 'bg-slate-700 text-slate-300'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <label
            htmlFor={id}
            className={cn(
              'font-medium cursor-pointer',
              styles.label,
              disabled && 'cursor-not-allowed'
            )}
          >
            {title}
          </label>
          {description && (
            <p className={cn('text-sm mt-0.5', styles.description)}>
              {description}
            </p>
          )}
        </div>
      </div>
      <GlassToggle
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        variant={variant}
        size="md"
      />
    </div>
  );
}

// ============================================
// SETTINGS SECTION
// ============================================

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Settings items */
  children: ReactNode;
  /** Glass variant */
  variant?: ToggleVariant;
  /** Additional class name */
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  variant = 'glass',
  className,
}: SettingsSectionProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className={cn('text-lg font-semibold', styles.label)}>{title}</h3>
        {description && (
          <p className={cn('text-sm mt-1', styles.description)}>{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ============================================
// TOGGLE CARD
// ============================================

export interface ToggleCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Icon */
  icon?: LucideIcon;
  /** Badge text */
  badge?: string;
  /** Badge color */
  badgeColor?: 'emerald' | 'blue' | 'amber' | 'red';
  /** Glass variant */
  variant?: ToggleVariant;
  /** Additional class name */
  className?: string;
}

export function ToggleCard({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
  variant = 'glass',
  className,
}: ToggleCardProps) {
  const styles = variantStyles[variant];

  const containerStyles = {
    default: cn(
      'bg-white border-2 hover:shadow-md',
      checked ? 'border-emerald-500' : 'border-slate-200 hover:border-slate-300'
    ),
    glass: cn(
      'backdrop-blur-md border-2',
      checked
        ? 'bg-emerald-500/10 border-emerald-500/50'
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    ),
    dark: cn(
      'border-2',
      checked
        ? 'bg-emerald-500/10 border-emerald-500'
        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
    ),
  };

  const badgeColors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-xl text-left transition-all duration-200',
        containerStyles[variant],
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              'shrink-0 p-2 rounded-lg transition-colors',
              checked
                ? 'bg-emerald-500/20 text-emerald-400'
                : variant === 'default'
                ? 'bg-slate-100 text-slate-500'
                : 'bg-white/10 text-white/60'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium', styles.label)}>{title}</span>
            {badge && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  badgeColors[badgeColor]
                )}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className={cn('text-sm mt-1', styles.description)}>{description}</p>
          )}
        </div>
        <div
          className={cn(
            'shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
            checked
              ? 'bg-emerald-500 border-emerald-500'
              : variant === 'default'
              ? 'border-slate-300'
              : 'border-white/30'
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

// ============================================
// FEATURE TOGGLE
// ============================================

export interface FeatureToggleProps {
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Beta/new badge */
  isBeta?: boolean;
  /** New feature badge */
  isNew?: boolean;
  /** Deprecation warning */
  isDeprecated?: boolean;
  /** Glass variant */
  variant?: ToggleVariant;
  /** Additional class name */
  className?: string;
}

export function FeatureToggle({
  name,
  description,
  checked,
  onChange,
  disabled = false,
  isBeta = false,
  isNew = false,
  isDeprecated = false,
  variant = 'glass',
  className,
}: FeatureToggleProps) {
  const id = useId();
  const styles = variantStyles[variant];

  const containerStyles = {
    default: 'bg-slate-50 border border-slate-200',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-slate-800/50 border border-slate-700',
  };

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl',
        containerStyles[variant],
        isDeprecated && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={id}
              className={cn('font-medium', styles.label)}
            >
              {name}
            </label>
            {isBeta && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                Beta
              </span>
            )}
            {isNew && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                New
              </span>
            )}
            {isDeprecated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                Deprecated
              </span>
            )}
          </div>
          <p className={cn('text-sm mt-1', styles.description)}>{description}</p>
        </div>
        <GlassToggle
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled || isDeprecated}
          variant={variant}
          size="md"
        />
      </div>
    </div>
  );
}

export default GlassToggle;
