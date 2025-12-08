'use client';

import React, {
  ReactNode,
  useEffect,
  useCallback,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface GlassModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description/subtitle */
  description?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Hide the close button */
  hideCloseButton?: boolean;
  /** Glass variant */
  variant?: 'default' | 'glass' | 'dark';
  /** Animation style */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'zoom' | 'none';
  /** Animation duration in ms */
  animationDuration?: number;
  /** Show ripple effect when clicking backdrop */
  showBackdropRipple?: boolean;
  /** Center content vertically */
  centered?: boolean;
  /** Additional class name for the modal content */
  className?: string;
  /** Additional class name for the backdrop */
  backdropClassName?: string;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Final focus element ref (focused on close) */
  finalFocusRef?: React.RefObject<HTMLElement>;
}

// ============================================
// SIZE & VARIANT CONFIGURATIONS
// ============================================

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

const sizeContentHeights = {
  sm: 'max-h-[50vh]',
  md: 'max-h-[60vh]',
  lg: 'max-h-[70vh]',
  xl: 'max-h-[75vh]',
  full: 'max-h-[80vh]',
};

const variantStyles = {
  default: {
    backdrop: 'bg-black/50 backdrop-blur-xl',
    modal: 'bg-white border border-slate-200 shadow-2xl',
    header: 'border-b border-slate-200',
    footer: 'border-t border-slate-100 bg-slate-50/50',
    title: 'text-slate-900',
    description: 'text-slate-500',
    closeButton: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
  },
  glass: {
    backdrop: 'bg-black/60 backdrop-blur-xl',
    modal: 'backdrop-blur-2xl bg-slate-900/90 border border-white/15 shadow-2xl shadow-black/40',
    header: 'border-b border-white/10',
    footer: 'border-t border-white/10 bg-white/[0.02]',
    title: 'text-white',
    description: 'text-white/60',
    closeButton: 'text-white/60 hover:text-white hover:bg-white/10',
  },
  dark: {
    backdrop: 'bg-black/70 backdrop-blur-xl',
    modal: 'bg-slate-900 border border-slate-800 shadow-2xl',
    header: 'border-b border-slate-800',
    footer: 'border-t border-slate-800 bg-slate-900/50',
    title: 'text-slate-100',
    description: 'text-slate-400',
    closeButton: 'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
  },
};

// ============================================
// CSS ANIMATION KEYFRAMES (injected once)
// ============================================

// Spring physics approximation using CSS cubic-bezier
// These curves mimic the behavior of spring animations:
// - Initial overshoot
// - Settling oscillation
// - Natural deceleration
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Spring with bounce
const SPRING_EASING_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'; // Spring settle
const SPRING_EASING_SMOOTH = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Smooth spring

const animationStyles = `
/* ═══════════════════════════════════════════════════════════════════
   BACKDROP ANIMATIONS - Smooth fade with spring-like ease
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-backdrop-in {
  0% { 
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  100% { 
    opacity: 1;
    backdrop-filter: blur(16px);
  }
}

@keyframes glass-modal-backdrop-out {
  0% { 
    opacity: 1;
    backdrop-filter: blur(16px);
  }
  100% { 
    opacity: 0;
    backdrop-filter: blur(0px);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SCALE ANIMATION - 0.8 -> 1 -> 0.8 with spring physics
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-scale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
  }
  70% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glass-modal-scale-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  30% {
    transform: scale(1.02);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE UP ANIMATION - with spring bounce
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-slide-up {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.01);
  }
  80% {
    transform: translateY(2px) scale(0.995);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes glass-modal-slide-up-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  30% {
    opacity: 1;
    transform: translateY(-5px) scale(1.01);
  }
  100% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE DOWN ANIMATION - with spring bounce
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-slide-down {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(5px) scale(1.01);
  }
  80% {
    transform: translateY(-2px) scale(0.995);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes glass-modal-slide-down-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  30% {
    opacity: 1;
    transform: translateY(5px) scale(1.01);
  }
  100% {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FADE ANIMATION - Simple opacity transition
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-fade {
  0% { 
    opacity: 0;
    transform: scale(0.98);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glass-modal-fade-out {
  0% { 
    opacity: 1;
    transform: scale(1);
  }
  100% { 
    opacity: 0;
    transform: scale(0.98);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ZOOM/BOUNCE ANIMATION - More dramatic spring effect
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-zoom {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.98);
  }
  85% {
    transform: scale(1.01);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glass-modal-zoom-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  20% {
    transform: scale(1.03);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   BACKDROP CLICK RIPPLE EFFECT
═══════════════════════════════════════════════════════════════════ */

@keyframes glass-modal-ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.glass-modal-backdrop-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  animation: glass-modal-ripple 0.6s ease-out forwards;
}
`;

// Inject styles once
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = animationStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ============================================
// FOCUS TRAP HOOK
// ============================================

function useFocusTrap(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLDivElement>,
  initialFocusRef?: React.RefObject<HTMLElement>,
  finalFocusRef?: React.RefObject<HTMLElement>
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable
    const focusInitial = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    };

    // Delay to ensure modal is rendered
    const timeoutId = setTimeout(focusInitial, 10);

    return () => {
      clearTimeout(timeoutId);
      // Restore focus on close
      if (finalFocusRef?.current) {
        finalFocusRef.current.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, modalRef, initialFocusRef, finalFocusRef]);

  // Handle tab key for focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [modalRef]
  );

  return { handleKeyDown };
}

// ============================================
// SCROLL LOCK HOOK
// ============================================

function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================

export function GlassModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  hideCloseButton = false,
  variant = 'glass',
  animation = 'slide-up',
  animationDuration = 300,
  showBackdropRipple = true,
  centered = true,
  className,
  backdropClassName,
  initialFocusRef,
  finalFocusRef,
}: GlassModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  const styles = variantStyles[variant];

  // Inject CSS animations
  useEffect(() => {
    injectStyles();
  }, []);

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap
  const { handleKeyDown: handleFocusTrapKeyDown } = useFocusTrap(
    isOpen && !isClosing,
    modalRef,
    initialFocusRef,
    finalFocusRef
  );

  // Scroll lock
  useScrollLock(isOpen);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (animation === 'none') {
      onClose();
      return;
    }

    setIsClosing(true);
    // Use slightly shorter duration for exit
    const exitDuration = Math.max(animationDuration * 0.8, 150);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, exitDuration);
  }, [animation, animationDuration, onClose]);

  // Handle backdrop click with ripple effect
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdropClick) return;
    
    // Add ripple effect
    if (showBackdropRipple && backdropRef.current) {
      const rect = backdropRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++rippleIdRef.current;
      
      setRipples(prev => [...prev, { id, x, y }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    handleClose();
  }, [closeOnBackdropClick, showBackdropRipple, handleClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // Spring physics easing curves
  const getSpringEasing = (isExit: boolean) => {
    if (isExit) {
      // Faster, snappier exit
      return 'cubic-bezier(0.22, 1, 0.36, 1)';
    }
    // Entry with slight overshoot (spring bounce)
    return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  };

  // Get animation classes
  const getAnimationStyle = (isBackdrop: boolean) => {
    if (animation === 'none') return {};

    const duration = `${animationDuration}ms`;
    const exitDuration = `${Math.max(animationDuration * 0.8, 150)}ms`;
    const easing = getSpringEasing(isClosing);

    if (isBackdrop) {
      return {
        animation: isClosing
          ? `glass-modal-backdrop-out ${exitDuration} ease-out forwards`
          : `glass-modal-backdrop-in ${duration} ease-out forwards`,
      };
    }

    const animationName = isClosing
      ? `glass-modal-${animation}-out`
      : `glass-modal-${animation}`;

    return {
      animation: `${animationName} ${isClosing ? exitDuration : duration} ${easing} forwards`,
    };
  };

  if (!isOpen && !isClosing) return null;
  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'glass-modal-title' : undefined}
      aria-describedby={description ? 'glass-modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={cn(
          'fixed inset-0 z-[100] overflow-hidden',
          styles.backdrop,
          backdropClassName
        )}
        style={getAnimationStyle(true)}
        onClick={handleBackdropClick}
        aria-hidden="true"
      >
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="glass-modal-backdrop-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
            }}
          />
        ))}
      </div>

      {/* Modal Container */}
      <div
        className={cn(
          'fixed inset-0 z-[101] overflow-y-auto',
          centered
            ? 'flex min-h-full items-center justify-center p-4'
            : 'flex min-h-full items-start justify-center p-4 pt-16'
        )}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative w-full rounded-2xl overflow-hidden',
            sizeClasses[size],
            styles.modal,
            className
          )}
          style={getAnimationStyle(false)}
          onKeyDown={handleFocusTrapKeyDown as any}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || description || !hideCloseButton) && (
            <div className={cn('flex items-start justify-between p-5', styles.header)}>
              <div className="flex-1 min-w-0 pr-4">
                {title && (
                  <h2
                    id="glass-modal-title"
                    className={cn('text-lg font-semibold', styles.title)}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="glass-modal-description"
                    className={cn('mt-1 text-sm', styles.description)}
                  >
                    {description}
                  </p>
                )}
              </div>
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn(
                    'p-2 -m-2 rounded-lg transition-colors shrink-0',
                    styles.closeButton
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className={cn(
              'p-5 overflow-y-auto',
              sizeContentHeights[size],
              !title && !description && hideCloseButton && 'pt-5'
            )}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                'flex items-center justify-end gap-3 p-5',
                styles.footer
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  return createPortal(modalContent, document.body);
}

// ============================================
// GLASS CONFIRM MODAL
// ============================================

export interface GlassConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  loading?: boolean;
  icon?: boolean;
}

export function GlassConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  icon = true,
}: GlassConfirmModalProps) {
  const confirmButtonStyles = {
    default:
      'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    danger:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25',
    success:
      'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25',
  };

  const iconMap = {
    default: Info,
    danger: AlertTriangle,
    warning: AlertTriangle,
    success: CheckCircle,
  };

  const iconColors = {
    default: 'text-emerald-400 bg-emerald-500/20',
    danger: 'text-red-400 bg-red-500/20',
    warning: 'text-amber-400 bg-amber-500/20',
    success: 'text-green-400 bg-green-500/20',
  };

  const Icon = iconMap[variant];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      animation="scale"
      hideCloseButton
    >
      <div className="text-center">
        {icon && (
          <div
            className={cn(
              'w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center',
              iconColors[variant]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-white/60 mb-6">{description}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
              confirmButtonStyles[variant]
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}

// ============================================
// GLASS ALERT MODAL
// ============================================

export interface GlassAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function GlassAlertModal({
  isOpen,
  onClose,
  title,
  description,
  buttonText = 'OK',
  variant = 'info',
}: GlassAlertModalProps) {
  const iconMap = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
  };

  const iconColors = {
    info: 'text-blue-400 bg-blue-500/20',
    success: 'text-green-400 bg-green-500/20',
    warning: 'text-amber-400 bg-amber-500/20',
    error: 'text-red-400 bg-red-500/20',
  };

  const buttonColors = {
    info: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
    success: 'bg-green-500 hover:bg-green-600 shadow-green-500/25',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25',
    error: 'bg-red-500 hover:bg-red-600 shadow-red-500/25',
  };

  const Icon = iconMap[variant];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      animation="scale"
      hideCloseButton
      closeOnBackdropClick={false}
    >
      <div className="text-center">
        <div
          className={cn(
            'w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center',
            iconColors[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-white/60 mb-6">{description}</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg transition-all',
            buttonColors[variant]
          )}
        >
          {buttonText}
        </button>
      </div>
    </GlassModal>
  );
}

// ============================================
// GLASS DRAWER - Enhanced
// ============================================

export interface GlassDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Called when the drawer should close */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer description */
  description?: string;
  /** Drawer content */
  children: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Which side the drawer appears from */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Drawer size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Glass variant */
  variant?: 'default' | 'glass' | 'dark';
  /** Additional class name */
  className?: string;
}

const drawerSizeClasses = {
  left: { sm: 'w-72', md: 'w-96', lg: 'w-[480px]', xl: 'w-[560px]', full: 'w-full max-w-2xl' },
  right: { sm: 'w-72', md: 'w-96', lg: 'w-[480px]', xl: 'w-[560px]', full: 'w-full max-w-2xl' },
  top: { sm: 'h-48', md: 'h-72', lg: 'h-96', xl: 'h-[480px]', full: 'h-full max-h-[80vh]' },
  bottom: { sm: 'h-48', md: 'h-72', lg: 'h-96', xl: 'h-[480px]', full: 'h-full max-h-[80vh]' },
};

const drawerAnimations = `
@keyframes glass-drawer-slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes glass-drawer-slide-right-out {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}
@keyframes glass-drawer-slide-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes glass-drawer-slide-left-out {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}
@keyframes glass-drawer-slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
@keyframes glass-drawer-slide-down-out {
  from { transform: translateY(0); }
  to { transform: translateY(-100%); }
}
@keyframes glass-drawer-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes glass-drawer-slide-up-out {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
`;

let drawerStylesInjected = false;
function injectDrawerStyles() {
  if (drawerStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = drawerAnimations;
  document.head.appendChild(style);
  drawerStylesInjected = true;
}

export function GlassDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  variant = 'glass',
  className,
}: GlassDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const styles = variantStyles[variant];

  useEffect(() => {
    injectDrawerStyles();
    setMounted(true);
  }, []);

  // Focus trap
  const { handleKeyDown: handleFocusTrapKeyDown } = useFocusTrap(
    isOpen && !isClosing,
    drawerRef
  );

  // Scroll lock
  useScrollLock(isOpen);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const getDrawerAnimation = () => {
    const animationMap = {
      left: isClosing ? 'glass-drawer-slide-right-out' : 'glass-drawer-slide-right',
      right: isClosing ? 'glass-drawer-slide-left-out' : 'glass-drawer-slide-left',
      top: isClosing ? 'glass-drawer-slide-down-out' : 'glass-drawer-slide-down',
      bottom: isClosing ? 'glass-drawer-slide-up-out' : 'glass-drawer-slide-up',
    };
    return {
      animation: `${animationMap[side]} 300ms cubic-bezier(0.32, 0.72, 0, 1) forwards`,
    };
  };

  const positionClasses = {
    left: 'left-0 top-0 bottom-0 border-r',
    right: 'right-0 top-0 bottom-0 border-l',
    top: 'top-0 left-0 right-0 border-b',
    bottom: 'bottom-0 left-0 right-0 border-t',
  };

  if (!isOpen && !isClosing) return null;
  if (!mounted) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0', styles.backdrop)}
        style={{
          animation: isClosing
            ? 'glass-modal-backdrop-out 200ms ease-out forwards'
            : 'glass-modal-backdrop-in 200ms ease-out forwards',
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed flex flex-col z-[101]',
          styles.modal,
          positionClasses[side],
          drawerSizeClasses[side][size],
          className
        )}
        style={getDrawerAnimation()}
        onKeyDown={handleFocusTrapKeyDown as any}
      >
        {/* Header */}
        {(title || description) && (
          <div className={cn('flex items-start justify-between p-5', styles.header)}>
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2 className={cn('text-lg font-semibold', styles.title)}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={cn('mt-1 text-sm', styles.description)}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'p-2 -m-2 rounded-lg transition-colors shrink-0',
                styles.closeButton
              )}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className={cn('flex items-center justify-end gap-3 p-5', styles.footer)}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

// ============================================
// GLASS PROMPT MODAL
// ============================================

export interface GlassPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  inputType?: 'text' | 'email' | 'password' | 'number' | 'textarea';
}

export function GlassPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  placeholder = '',
  defaultValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  inputType = 'text',
}: GlassPromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      initialFocusRef={inputRef as React.RefObject<HTMLElement>}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : submitText}
          </button>
        </>
      }
    >
      {inputType === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      )}
    </GlassModal>
  );
}

export default GlassModal;
