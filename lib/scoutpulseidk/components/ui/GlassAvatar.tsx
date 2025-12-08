'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { User, Users, type LucideIcon } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy' | 'none';
export type AvatarVariant = 'default' | 'glass' | 'gradient' | 'outline';

export interface GlassAvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Name for generating initials */
  name?: string;
  /** Custom initials (overrides name) */
  initials?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Glass variant */
  variant?: AvatarVariant;
  /** Custom fallback icon */
  fallbackIcon?: LucideIcon;
  /** Click handler */
  onClick?: () => void;
  /** Whether avatar is clickable/interactive */
  interactive?: boolean;
  /** Show ring/border */
  showRing?: boolean;
  /** Ring color (tailwind class) */
  ringColor?: string;
  /** Background color for initials (tailwind class or auto-generated) */
  bgColor?: string;
  /** Additional class name */
  className?: string;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeClasses: Record<AvatarSize, {
  container: string;
  text: string;
  icon: string;
  status: string;
  statusPosition: string;
  ring: string;
}> = {
  xs: {
    container: 'h-6 w-6',
    text: 'text-[10px]',
    icon: 'h-3 w-3',
    status: 'h-1.5 w-1.5',
    statusPosition: '-right-0.5 -bottom-0.5',
    ring: 'ring-1 ring-offset-1',
  },
  sm: {
    container: 'h-8 w-8',
    text: 'text-xs',
    icon: 'h-4 w-4',
    status: 'h-2 w-2',
    statusPosition: '-right-0.5 -bottom-0.5',
    ring: 'ring-2 ring-offset-1',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-sm',
    icon: 'h-5 w-5',
    status: 'h-2.5 w-2.5',
    statusPosition: 'right-0 bottom-0',
    ring: 'ring-2 ring-offset-2',
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-base',
    icon: 'h-6 w-6',
    status: 'h-3 w-3',
    statusPosition: 'right-0 bottom-0',
    ring: 'ring-2 ring-offset-2',
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-lg',
    icon: 'h-7 w-7',
    status: 'h-3.5 w-3.5',
    statusPosition: 'right-0.5 bottom-0.5',
    ring: 'ring-[3px] ring-offset-2',
  },
  '2xl': {
    container: 'h-24 w-24',
    text: 'text-2xl',
    icon: 'h-10 w-10',
    status: 'h-4 w-4',
    statusPosition: 'right-1 bottom-1',
    ring: 'ring-[3px] ring-offset-2',
  },
};

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles: Record<AvatarVariant, {
  container: string;
  fallback: string;
  ring: string;
}> = {
  default: {
    container: 'bg-slate-200',
    fallback: 'bg-slate-700 text-slate-200',
    ring: 'ring-white',
  },
  glass: {
    container: 'bg-white/10 backdrop-blur-md border border-white/20',
    fallback: 'bg-slate-800/80 backdrop-blur-md border border-white/10 text-white',
    ring: 'ring-white/30',
  },
  gradient: {
    container: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
    fallback: 'bg-gradient-to-br from-emerald-500 to-cyan-600 text-white',
    ring: 'ring-emerald-500/30',
  },
  outline: {
    container: 'bg-transparent border-2 border-slate-300',
    fallback: 'bg-transparent border-2 border-slate-600 text-slate-400',
    ring: 'ring-slate-400',
  },
};

// ============================================
// STATUS COLORS
// ============================================

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
  none: '',
};

// ============================================
// UTILITIES
// ============================================

/**
 * Generate initials from a name
 */
function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, maxLength).toUpperCase();
  }

  return parts
    .slice(0, maxLength)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Generate a consistent color based on a string
 */
function stringToColor(str: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassAvatar({
  src,
  alt,
  name,
  initials: customInitials,
  size = 'md',
  status = 'none',
  variant = 'glass',
  fallbackIcon: FallbackIcon,
  onClick,
  interactive = false,
  showRing = false,
  ringColor,
  bgColor,
  className,
}: GlassAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeConfig = sizeClasses[size];
  const variantConfig = variantStyles[variant];

  const displayInitials = useMemo(() => {
    if (customInitials) return customInitials.slice(0, 2).toUpperCase();
    if (name) return getInitials(name);
    return '';
  }, [customInitials, name]);

  const autoColor = useMemo(() => {
    if (bgColor) return bgColor;
    if (name) return stringToColor(name);
    return '';
  }, [bgColor, name]);

  const showImage = src && !imageError;
  const showInitials = !showImage && displayInitials;
  const showIcon = !showImage && !showInitials;

  const isClickable = onClick || interactive;

  const Icon = FallbackIcon || User;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {/* Avatar Container */}
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center',
          'transition-all duration-200',
          sizeConfig.container,
          showRing && sizeConfig.ring,
          showRing && (ringColor || variantConfig.ring),
          showRing && 'ring-offset-slate-900',
          isClickable && 'hover:scale-105 hover:shadow-lg active:scale-95',
          // Container style based on content
          showImage && variantConfig.container,
          (showInitials || showIcon) && (autoColor || variantConfig.fallback)
        )}
      >
        {/* Image */}
        {src && !imageError && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Loading placeholder while image loads */}
        {src && !imageError && !imageLoaded && (
          <div
            className={cn(
              'absolute inset-0 animate-pulse',
              variant === 'glass'
                ? 'bg-white/10'
                : 'bg-slate-300'
            )}
          />
        )}

        {/* Initials Fallback */}
        {showInitials && (
          <span
            className={cn(
              'font-semibold select-none',
              sizeConfig.text,
              variant === 'outline' ? 'text-slate-600' : 'text-white'
            )}
          >
            {displayInitials}
          </span>
        )}

        {/* Icon Fallback */}
        {showIcon && (
          <Icon
            className={cn(
              sizeConfig.icon,
              variant === 'outline' ? 'text-slate-500' : 'text-white/80'
            )}
          />
        )}

        {/* Glass overlay for variant */}
        {variant === 'glass' && showImage && (
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
        )}
      </div>

      {/* Status Indicator */}
      {status !== 'none' && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-slate-900',
            sizeConfig.status,
            sizeConfig.statusPosition,
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

// ============================================
// AVATAR GROUP
// ============================================

export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: Array<Omit<GlassAvatarProps, 'size' | 'variant'>>;
  /** Maximum avatars to show */
  max?: number;
  /** Avatar size */
  size?: AvatarSize;
  /** Glass variant */
  variant?: AvatarVariant;
  /** Spacing between avatars (negative for overlap) */
  spacing?: 'tight' | 'normal' | 'loose';
  /** Show count of hidden avatars */
  showCount?: boolean;
  /** Click handler for the +N button */
  onMoreClick?: () => void;
  /** Additional class name */
  className?: string;
}

const spacingClasses = {
  tight: '-space-x-3',
  normal: '-space-x-2',
  loose: '-space-x-1',
};

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  variant = 'glass',
  spacing = 'normal',
  showCount = true,
  onMoreClick,
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const hiddenCount = Math.max(0, avatars.length - max);
  const sizeConfig = sizeClasses[size];

  return (
    <div className={cn('flex items-center', spacingClasses[spacing], className)}>
      {visibleAvatars.map((avatar, index) => (
        <GlassAvatar
          key={avatar.name || index}
          {...avatar}
          size={size}
          variant={variant}
          showRing
          className="relative hover:z-10"
        />
      ))}

      {showCount && hiddenCount > 0 && (
        <button
          type="button"
          onClick={onMoreClick}
          className={cn(
            'relative rounded-full flex items-center justify-center font-medium',
            'transition-all duration-200 hover:scale-105',
            sizeConfig.container,
            sizeConfig.text,
            variant === 'glass'
              ? 'bg-slate-800/80 backdrop-blur-md border border-white/10 text-white hover:bg-slate-700/80'
              : 'bg-slate-700 text-white hover:bg-slate-600',
            sizeConfig.ring,
            'ring-slate-900 ring-offset-slate-900'
          )}
        >
          +{hiddenCount}
        </button>
      )}
    </div>
  );
}

// ============================================
// AVATAR WITH BADGE
// ============================================

export interface AvatarWithBadgeProps extends GlassAvatarProps {
  /** Badge content (number or icon) */
  badge?: number | LucideIcon;
  /** Badge color */
  badgeColor?: 'emerald' | 'red' | 'amber' | 'blue' | 'slate';
  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Max badge number (shows 99+ if exceeded) */
  maxBadge?: number;
}

const badgeColors = {
  emerald: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
  amber: 'bg-amber-500 text-white',
  blue: 'bg-blue-500 text-white',
  slate: 'bg-slate-600 text-white',
};

const badgePositions = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
};

export function AvatarWithBadge({
  badge,
  badgeColor = 'red',
  badgePosition = 'top-right',
  maxBadge = 99,
  ...avatarProps
}: AvatarWithBadgeProps) {
  const sizeConfig = sizeClasses[avatarProps.size || 'md'];

  const badgeSizes: Record<AvatarSize, string> = {
    xs: 'h-3 min-w-3 text-[8px] px-0.5',
    sm: 'h-4 min-w-4 text-[10px] px-1',
    md: 'h-5 min-w-5 text-xs px-1',
    lg: 'h-5 min-w-5 text-xs px-1.5',
    xl: 'h-6 min-w-6 text-sm px-1.5',
    '2xl': 'h-7 min-w-7 text-sm px-2',
  };

  const renderBadge = () => {
    if (badge === undefined) return null;

    if (typeof badge === 'number') {
      const displayNumber = badge > maxBadge ? `${maxBadge}+` : badge;
      return (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full font-medium',
            'border-2 border-slate-900',
            badgeSizes[avatarProps.size || 'md'],
            badgePositions[badgePosition],
            badgeColors[badgeColor]
          )}
        >
          {displayNumber}
        </span>
      );
    }

    const BadgeIcon = badge;
    return (
      <span
        className={cn(
          'absolute flex items-center justify-center rounded-full',
          'border-2 border-slate-900',
          badgeSizes[avatarProps.size || 'md'],
          badgePositions[badgePosition],
          badgeColors[badgeColor]
        )}
      >
        <BadgeIcon className="h-3 w-3" />
      </span>
    );
  };

  return (
    <div className="relative inline-flex">
      <GlassAvatar {...avatarProps} />
      {renderBadge()}
    </div>
  );
}

// ============================================
// AVATAR WITH LABEL
// ============================================

export interface AvatarWithLabelProps extends GlassAvatarProps {
  /** Primary label (name) */
  label: string;
  /** Secondary label (subtitle) */
  sublabel?: string;
  /** Label position */
  labelPosition?: 'right' | 'bottom';
  /** Additional class for label container */
  labelClassName?: string;
}

export function AvatarWithLabel({
  label,
  sublabel,
  labelPosition = 'right',
  labelClassName,
  ...avatarProps
}: AvatarWithLabelProps) {
  const textSizes: Record<AvatarSize, { label: string; sublabel: string }> = {
    xs: { label: 'text-xs', sublabel: 'text-[10px]' },
    sm: { label: 'text-sm', sublabel: 'text-xs' },
    md: { label: 'text-sm', sublabel: 'text-xs' },
    lg: { label: 'text-base', sublabel: 'text-sm' },
    xl: { label: 'text-lg', sublabel: 'text-sm' },
    '2xl': { label: 'text-xl', sublabel: 'text-base' },
  };

  const sizes = textSizes[avatarProps.size || 'md'];

  return (
    <div
      className={cn(
        'inline-flex items-center',
        labelPosition === 'bottom' ? 'flex-col text-center' : 'flex-row',
        labelClassName
      )}
    >
      <GlassAvatar {...avatarProps} name={avatarProps.name || label} />
      <div
        className={cn(
          labelPosition === 'bottom' ? 'mt-2' : 'ml-3',
          'min-w-0'
        )}
      >
        <p className={cn('font-medium text-white truncate', sizes.label)}>
          {label}
        </p>
        {sublabel && (
          <p className={cn('text-white/60 truncate', sizes.sublabel)}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// TEAM AVATAR (for organizations/teams)
// ============================================

export interface TeamAvatarProps {
  /** Team/organization name */
  name: string;
  /** Logo URL */
  logoUrl?: string | null;
  /** Size */
  size?: AvatarSize;
  /** Variant */
  variant?: AvatarVariant;
  /** Show ring */
  showRing?: boolean;
  /** Additional class name */
  className?: string;
}

export function TeamAvatar({
  name,
  logoUrl,
  size = 'md',
  variant = 'glass',
  showRing = false,
  className,
}: TeamAvatarProps) {
  return (
    <GlassAvatar
      src={logoUrl}
      name={name}
      size={size}
      variant={variant}
      showRing={showRing}
      fallbackIcon={Users}
      className={cn('rounded-lg', className)}
    />
  );
}

export default GlassAvatar;
