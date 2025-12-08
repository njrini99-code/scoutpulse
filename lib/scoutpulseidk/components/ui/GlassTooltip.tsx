'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  cloneElement,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  Info,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface GlassTooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Placement of the tooltip */
  placement?: TooltipPlacement;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Delay before hiding (ms) */
  delayHide?: number;
  /** Glass variant */
  variant?: 'default' | 'glass' | 'dark' | 'light';
  /** Show arrow indicator */
  showArrow?: boolean;
  /** Max width of tooltip */
  maxWidth?: number;
  /** Offset from trigger element */
  offset?: number;
  /** Disable tooltip */
  disabled?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional class name */
  className?: string;
  /** Trigger on click instead of hover */
  triggerOnClick?: boolean;
}

// ============================================
// CSS ANIMATIONS
// ============================================

const tooltipAnimations = `
@keyframes glass-tooltip-fade-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glass-tooltip-fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}

@keyframes glass-tooltip-slide-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glass-tooltip-slide-down {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glass-tooltip-slide-left {
  from {
    opacity: 0;
    transform: translateX(4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes glass-tooltip-slide-right {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`;

let tooltipStylesInjected = false;
function injectTooltipStyles() {
  if (tooltipStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = tooltipAnimations;
  document.head.appendChild(style);
  tooltipStylesInjected = true;
}

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles = {
  default: {
    tooltip: 'bg-slate-900 text-white shadow-lg',
    arrow: 'border-slate-900',
  },
  glass: {
    tooltip: 'bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-xl',
    arrow: 'border-slate-900/90',
  },
  dark: {
    tooltip: 'bg-slate-950 text-slate-100 shadow-xl border border-slate-800',
    arrow: 'border-slate-950',
  },
  light: {
    tooltip: 'bg-white text-slate-900 shadow-lg border border-slate-200',
    arrow: 'border-white',
  },
};

// ============================================
// POSITIONING UTILITIES
// ============================================

interface Position {
  top: number;
  left: number;
  arrowTop?: number;
  arrowLeft?: number;
  actualPlacement: TooltipPlacement;
}

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
  offset: number,
  arrowSize: number
): Position {
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let arrowTop: number | undefined;
  let arrowLeft: number | undefined;
  let actualPlacement = placement;

  const totalOffset = offset + arrowSize;

  // Calculate base position
  const positions: Record<string, { top: number; left: number }> = {
    top: {
      top: triggerRect.top + scrollY - tooltipRect.height - totalOffset,
      left: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
    },
    'top-start': {
      top: triggerRect.top + scrollY - tooltipRect.height - totalOffset,
      left: triggerRect.left + scrollX,
    },
    'top-end': {
      top: triggerRect.top + scrollY - tooltipRect.height - totalOffset,
      left: triggerRect.right + scrollX - tooltipRect.width,
    },
    bottom: {
      top: triggerRect.bottom + scrollY + totalOffset,
      left: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
    },
    'bottom-start': {
      top: triggerRect.bottom + scrollY + totalOffset,
      left: triggerRect.left + scrollX,
    },
    'bottom-end': {
      top: triggerRect.bottom + scrollY + totalOffset,
      left: triggerRect.right + scrollX - tooltipRect.width,
    },
    left: {
      top: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left + scrollX - tooltipRect.width - totalOffset,
    },
    'left-start': {
      top: triggerRect.top + scrollY,
      left: triggerRect.left + scrollX - tooltipRect.width - totalOffset,
    },
    'left-end': {
      top: triggerRect.bottom + scrollY - tooltipRect.height,
      left: triggerRect.left + scrollX - tooltipRect.width - totalOffset,
    },
    right: {
      top: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + scrollX + totalOffset,
    },
    'right-start': {
      top: triggerRect.top + scrollY,
      left: triggerRect.right + scrollX + totalOffset,
    },
    'right-end': {
      top: triggerRect.bottom + scrollY - tooltipRect.height,
      left: triggerRect.right + scrollX + totalOffset,
    },
  };

  // Get initial position
  const pos = positions[placement];
  top = pos.top;
  left = pos.left;

  // Check if tooltip fits in viewport and flip if needed
  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  // Flip vertical
  if (placement.startsWith('top') && triggerRect.top - tooltipRect.height - totalOffset < 0) {
    actualPlacement = placement.replace('top', 'bottom') as TooltipPlacement;
    top = positions[actualPlacement].top;
  } else if (
    placement.startsWith('bottom') &&
    triggerRect.bottom + tooltipRect.height + totalOffset > viewportHeight
  ) {
    actualPlacement = placement.replace('bottom', 'top') as TooltipPlacement;
    top = positions[actualPlacement].top;
  }

  // Flip horizontal
  if (
    placement.startsWith('left') &&
    triggerRect.left - tooltipRect.width - totalOffset < 0
  ) {
    actualPlacement = placement.replace('left', 'right') as TooltipPlacement;
    left = positions[actualPlacement].left;
  } else if (
    placement.startsWith('right') &&
    triggerRect.right + tooltipRect.width + totalOffset > viewportWidth
  ) {
    actualPlacement = placement.replace('right', 'left') as TooltipPlacement;
    left = positions[actualPlacement].left;
  }

  // Constrain to viewport
  const padding = 8;
  left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding + scrollX));
  top = Math.max(padding + scrollY, top);

  // Calculate arrow position
  if (actualPlacement.startsWith('top') || actualPlacement.startsWith('bottom')) {
    arrowLeft = triggerCenterX + scrollX - left - arrowSize / 2;
    arrowLeft = Math.max(8, Math.min(arrowLeft, tooltipRect.width - 8 - arrowSize));
  } else {
    arrowTop = triggerCenterY + scrollY - top - arrowSize / 2;
    arrowTop = Math.max(8, Math.min(arrowTop, tooltipRect.height - 8 - arrowSize));
  }

  return { top, left, arrowTop, arrowLeft, actualPlacement };
}

// ============================================
// ARROW COMPONENT
// ============================================

interface ArrowProps {
  placement: TooltipPlacement;
  variant: 'default' | 'glass' | 'dark' | 'light';
  style?: React.CSSProperties;
}

function Arrow({ placement, variant, style }: ArrowProps) {
  const styles = variantStyles[variant];

  const getArrowClasses = () => {
    const base = 'absolute w-2 h-2 rotate-45';

    if (placement.startsWith('top')) {
      return cn(base, 'bottom-[-4px]', styles.arrow, 'border-b border-r');
    }
    if (placement.startsWith('bottom')) {
      return cn(base, 'top-[-4px]', styles.arrow, 'border-t border-l');
    }
    if (placement.startsWith('left')) {
      return cn(base, 'right-[-4px]', styles.arrow, 'border-t border-r');
    }
    if (placement.startsWith('right')) {
      return cn(base, 'left-[-4px]', styles.arrow, 'border-b border-l');
    }
    return base;
  };

  const getBgClass = () => {
    if (variant === 'glass') return 'bg-slate-900/90';
    if (variant === 'dark') return 'bg-slate-950';
    if (variant === 'light') return 'bg-white';
    return 'bg-slate-900';
  };

  return <div className={cn(getArrowClasses(), getBgClass())} style={style} />;
}

// ============================================
// MAIN TOOLTIP COMPONENT
// ============================================

export function GlassTooltip({
  content,
  children,
  placement = 'top',
  delayShow = 200,
  delayHide = 0,
  variant = 'glass',
  showArrow = true,
  maxWidth = 280,
  offset = 4,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
  triggerOnClick = false,
}: GlassTooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const styles = variantStyles[variant];
  const arrowSize = 8;

  // Inject styles
  useEffect(() => {
    injectTooltipStyles();
    setMounted(true);
  }, []);

  // Calculate position when open
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const newPosition = calculatePosition(
        triggerRect,
        tooltipRect,
        placement,
        offset,
        showArrow ? arrowSize : 0
      );

      setPosition(newPosition);
      setIsVisible(true);
    };

    // Initial position calculation with RAF for accurate measurement
    requestAnimationFrame(updatePosition);

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, placement, offset, showArrow, arrowSize]);

  // Open/close handlers
  const handleOpen = useCallback(() => {
    if (disabled) return;

    clearTimeout(hideTimeoutRef.current);

    if (delayShow > 0) {
      showTimeoutRef.current = setTimeout(() => {
        if (isControlled) {
          onOpenChange?.(true);
        } else {
          setInternalOpen(true);
        }
      }, delayShow);
    } else {
      if (isControlled) {
        onOpenChange?.(true);
      } else {
        setInternalOpen(true);
      }
    }
  }, [disabled, delayShow, isControlled, onOpenChange]);

  const handleClose = useCallback(() => {
    clearTimeout(showTimeoutRef.current);

    if (delayHide > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setInternalOpen(false);
        }
      }, delayHide);
    } else {
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
    }
  }, [delayHide, isControlled, onOpenChange]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleOpen, handleClose]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Get animation based on placement
  const getAnimation = () => {
    const actualPlacement = position?.actualPlacement || placement;
    if (actualPlacement.startsWith('top')) return 'glass-tooltip-slide-down';
    if (actualPlacement.startsWith('bottom')) return 'glass-tooltip-slide-up';
    if (actualPlacement.startsWith('left')) return 'glass-tooltip-slide-left';
    if (actualPlacement.startsWith('right')) return 'glass-tooltip-slide-right';
    return 'glass-tooltip-fade-in';
  };

  // Clone children with ref and event handlers
  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        ...(triggerOnClick
          ? {
              onClick: (e: React.MouseEvent) => {
                handleToggle();
                (children as React.ReactElement<any>).props.onClick?.(e);
              },
            }
          : {
              onMouseEnter: (e: React.MouseEvent) => {
                handleOpen();
                (children as React.ReactElement<any>).props.onMouseEnter?.(e);
              },
              onMouseLeave: (e: React.MouseEvent) => {
                handleClose();
                (children as React.ReactElement<any>).props.onMouseLeave?.(e);
              },
              onFocus: (e: React.FocusEvent) => {
                handleOpen();
                (children as React.ReactElement<any>).props.onFocus?.(e);
              },
              onBlur: (e: React.FocusEvent) => {
                handleClose();
                (children as React.ReactElement<any>).props.onBlur?.(e);
              },
            }),
      })
    : children;

  // Tooltip portal content
  const tooltipContent = isOpen && mounted && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'fixed z-[200] px-3 py-2 text-sm rounded-lg pointer-events-none',
        styles.tooltip,
        className
      )}
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        maxWidth,
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? `${getAnimation()} 150ms ease-out` : undefined,
      }}
    >
      {content}
      {showArrow && position && (
        <Arrow
          placement={position.actualPlacement}
          variant={variant}
          style={{
            ...(position.arrowLeft !== undefined && { left: position.arrowLeft }),
            ...(position.arrowTop !== undefined && { top: position.arrowTop }),
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

// ============================================
// INFO TOOLTIP - For metric explanations
// ============================================

export interface InfoTooltipProps {
  content: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  variant?: 'default' | 'glass' | 'dark' | 'light';
  placement?: TooltipPlacement;
  size?: 'sm' | 'md' | 'lg';
}

export function InfoTooltip({
  content,
  icon: Icon = Info,
  iconClassName,
  variant = 'glass',
  placement = 'top',
  size = 'md',
}: InfoTooltipProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <GlassTooltip content={content} variant={variant} placement={placement}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center text-slate-400 hover:text-slate-300 transition-colors cursor-help',
          iconClassName
        )}
        aria-label="More information"
      >
        <Icon className={sizeClasses[size]} />
      </button>
    </GlassTooltip>
  );
}

// ============================================
// METRIC TOOLTIP - For stats and metrics
// ============================================

export interface MetricTooltipProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  benchmark?: {
    label: string;
    value: string | number;
  };
  children: ReactNode;
  variant?: 'default' | 'glass' | 'dark' | 'light';
  placement?: TooltipPlacement;
}

export function MetricTooltip({
  label,
  value,
  description,
  trend,
  benchmark,
  children,
  variant = 'glass',
  placement = 'top',
}: MetricTooltipProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const content = (
    <div className="space-y-2 min-w-[180px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-white/60 text-xs uppercase tracking-wider">
          {label}
        </span>
        {trend && (
          <span className={cn('text-xs font-medium', trendColors[trend.direction])}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {description && (
        <p className="text-xs text-white/60 leading-relaxed">{description}</p>
      )}
      {benchmark && (
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">{benchmark.label}</span>
            <span className="text-white/80 font-medium">{benchmark.value}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <GlassTooltip
      content={content}
      variant={variant}
      placement={placement}
      maxWidth={240}
    >
      {children}
    </GlassTooltip>
  );
}

// ============================================
// ICON TOOLTIP - Quick tooltip for icons
// ============================================

export interface IconTooltipProps {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'dark' | 'light';
  placement?: TooltipPlacement;
  iconClassName?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export function IconTooltip({
  label,
  icon: Icon,
  onClick,
  variant = 'glass',
  placement = 'top',
  iconClassName,
  buttonClassName,
  disabled = false,
}: IconTooltipProps) {
  return (
    <GlassTooltip content={label} variant={variant} placement={placement}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-slate-400 hover:text-white hover:bg-white/10',
          disabled && 'opacity-50 cursor-not-allowed',
          buttonClassName
        )}
      >
        <Icon className={cn('h-4 w-4', iconClassName)} />
      </button>
    </GlassTooltip>
  );
}

// ============================================
// STATUS TOOLTIP - For status indicators
// ============================================

export interface StatusTooltipProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'glass' | 'dark' | 'light';
  placement?: TooltipPlacement;
}

export function StatusTooltip({
  status,
  label,
  description,
  children,
  variant = 'glass',
  placement = 'top',
}: StatusTooltipProps) {
  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    pending: { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const content = (
    <div className="flex items-start gap-3 min-w-[160px]">
      <div className={cn('p-1.5 rounded-lg', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div>
        <div className="font-medium text-white">{label}</div>
        {description && (
          <p className="text-xs text-white/60 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <GlassTooltip
      content={content}
      variant={variant}
      placement={placement}
      maxWidth={280}
    >
      {children}
    </GlassTooltip>
  );
}

// ============================================
// TOOLTIP GROUP - For toolbar-style tooltips
// ============================================

export interface TooltipItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
}

interface TooltipGroupProps {
  items: TooltipItem[];
  variant?: 'default' | 'glass' | 'dark' | 'light';
  placement?: TooltipPlacement;
  className?: string;
}

export function TooltipGroup({
  items,
  variant = 'glass',
  placement = 'top',
  className,
}: TooltipGroupProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {items.map((item) => (
        <IconTooltip
          key={item.id}
          label={item.label}
          icon={item.icon}
          onClick={item.onClick}
          disabled={item.disabled}
          variant={variant}
          placement={placement}
        />
      ))}
    </div>
  );
}

export default GlassTooltip;
