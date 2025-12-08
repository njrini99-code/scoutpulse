'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const toastAnimationStyles = `
@keyframes toast-slide-in-right {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-slide-out-right {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes toast-slide-in-top {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-slide-out-top {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-100%);
  }
}

@keyframes toast-slide-in-bottom {
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-slide-out-bottom {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(100%);
  }
}

@keyframes toast-progress {
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

@keyframes toast-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.toast-enter-right {
  animation: toast-slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.toast-exit-right {
  animation: toast-slide-out-right 0.2s ease-out forwards;
}

.toast-enter-top {
  animation: toast-slide-in-top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.toast-exit-top {
  animation: toast-slide-out-top 0.2s ease-out forwards;
}

.toast-enter-bottom {
  animation: toast-slide-in-bottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.toast-exit-bottom {
  animation: toast-slide-out-bottom 0.2s ease-out forwards;
}

.toast-shake {
  animation: toast-shake 0.5s ease-in-out;
}
`;

let stylesInjected = false;
function injectToastStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'glass-toast-styles';
  style.textContent = toastAnimationStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
  isExiting?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => Promise<T>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const toastStyles: Record<ToastType, { bg: string; icon: LucideIcon; iconColor: string; progress: string }> = {
  success: {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
    progress: 'bg-blue-500',
  },
  loading: {
    bg: 'bg-slate-500/10 border-slate-500/30',
    icon: Loader2,
    iconColor: 'text-slate-400',
    progress: 'bg-slate-500',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  position: ToastPosition;
}

function ToastItem({ toast, onRemove, position }: ToastItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = toastStyles[toast.type];
  const Icon = toast.icon || style.icon;
  
  const getAnimationClass = () => {
    const isTop = position.startsWith('top');
    const isBottom = position.startsWith('bottom');
    const isCenter = position.includes('center');
    
    if (toast.isExiting) {
      if (isTop) return 'toast-exit-top';
      if (isBottom) return 'toast-exit-bottom';
      return 'toast-exit-right';
    }
    
    if (isTop && !isCenter) return 'toast-enter-right';
    if (isBottom && !isCenter) return 'toast-enter-right';
    if (isTop) return 'toast-enter-top';
    return 'toast-enter-bottom';
  };

  return (
    <div
      className={cn(
        'relative w-80 p-4 rounded-xl border backdrop-blur-xl shadow-2xl',
        'bg-slate-900/95',
        style.bg,
        getAnimationClass(),
        toast.type === 'error' && !toast.isExiting && 'toast-shake'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('shrink-0 mt-0.5', style.iconColor)}>
          <Icon className={cn('w-5 h-5', toast.type === 'loading' && 'animate-spin')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{toast.title}</p>
          {toast.description && (
            <p className="text-slate-400 text-sm mt-1">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-2 text-sm font-medium transition-colors',
                style.iconColor,
                'hover:underline'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        {toast.dismissible !== false && (
          <button
            onClick={() => onRemove(toast.id)}
            className={cn(
              'shrink-0 p-1 rounded-lg transition-all duration-200',
              'text-slate-400 hover:text-white hover:bg-white/10',
              isHovered ? 'opacity-100' : 'opacity-50'
            )}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && !isHovered && toast.type !== 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden bg-white/5">
          <div
            className={cn('h-full', style.progress)}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position: ToastPosition;
}

function ToastContainer({ toasts, onRemove, position }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    injectToastStyles();
  }, []);

  if (!mounted) return null;

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4 items-end',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-left': 'bottom-4 left-4 items-start',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} position={position} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Clear any existing timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Start exit animation
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    );

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = options.duration ?? (options.type === 'loading' ? 0 : defaultDuration);

      const newToast: Toast = {
        id,
        type: options.type || 'info',
        title: options.title,
        description: options.description,
        duration,
        dismissible: options.dismissible ?? true,
        action: options.action,
        icon: options.icon,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Remove oldest if exceeding max
        if (updated.length > maxToasts) {
          const oldest = updated[updated.length - 1];
          setTimeout(() => removeToast(oldest.id), 0);
          return updated.slice(0, maxToasts);
        }
        return updated;
      });

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [defaultDuration, maxToasts, removeToast]
  );

  const updateToast = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...options } : toast
      )
    );
  }, []);

  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    [addToast]
  );

  const loading = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'loading', title, description, duration: 0 }),
    [addToast]
  );

  const promiseFn = useCallback(
    async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ): Promise<T> => {
      const toastId = addToast({
        type: 'loading',
        title: options.loading,
        duration: 0,
      });

      try {
        const result = await promise;
        updateToast(toastId, {
          type: 'success',
          title: typeof options.success === 'function' ? options.success(result) : options.success,
        });
        // Set auto-dismiss for success
        setTimeout(() => removeToast(toastId), defaultDuration);
        return result;
      } catch (err) {
        const errorMessage = typeof options.error === 'function' 
          ? options.error(err as Error) 
          : options.error;
        updateToast(toastId, {
          type: 'error',
          title: errorMessage,
        });
        // Set auto-dismiss for error
        setTimeout(() => removeToast(toastId), defaultDuration);
        throw err;
      }
    },
    [addToast, updateToast, removeToast, defaultDuration]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
        promise: promiseFn,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE TOAST FUNCTION (for use outside React)
// ═══════════════════════════════════════════════════════════════════════════

// Global toast instance for imperative usage
let globalToast: ToastContextType | null = null;

export function setGlobalToast(toast: ToastContextType) {
  globalToast = toast;
}

export const toast = {
  success: (title: string, description?: string) => globalToast?.success(title, description),
  error: (title: string, description?: string) => globalToast?.error(title, description),
  warning: (title: string, description?: string) => globalToast?.warning(title, description),
  info: (title: string, description?: string) => globalToast?.info(title, description),
  loading: (title: string, description?: string) => globalToast?.loading(title, description),
  dismiss: (id: string) => globalToast?.removeToast(id),
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => globalToast?.promise(promise, options),
};

export default ToastProvider;
