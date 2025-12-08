'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  GraduationCap,
  School,
  Trophy,
  Building2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const loginAnimationStyles = `
@keyframes login-fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes login-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes login-success-check {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes login-pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.3);
  }
}

@keyframes field-error-appear {
  0% {
    opacity: 0;
    transform: translateY(-5px);
    max-height: 0;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    max-height: 30px;
  }
}

.login-form-enter {
  animation: login-fade-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.login-shake {
  animation: login-shake 0.5s ease-in-out;
}

.login-success-check {
  animation: login-success-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.login-success-glow {
  animation: login-pulse-glow 1.5s ease-in-out infinite;
}

.field-error-enter {
  animation: field-error-appear 0.3s ease-out forwards;
}
`;

let stylesInjected = false;
function injectLoginStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'login-form-styles';
  style.textContent = loginAnimationStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEV ACCOUNTS (kept for development mode)
// ═══════════════════════════════════════════════════════════════════════════

const DEV_ACCOUNTS = [
  {
    id: 'player',
    label: 'Player Dashboard',
    description: 'View as a baseball player',
    icon: User,
    path: '/player',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 'college',
    label: 'College Coach',
    description: 'View as a college coach',
    icon: GraduationCap,
    path: '/coach/college',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'high-school',
    label: 'High School Coach',
    description: 'View as a high school coach',
    icon: School,
    path: '/coach/high-school',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'showcase',
    label: 'Showcase Coach',
    description: 'View as a showcase/travel team coach',
    icon: Trophy,
    path: '/coach/showcase',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 'juco',
    label: 'JUCO Coach',
    description: 'View as a junior college coach',
    icon: Building2,
    path: '/coach/juco',
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOAST COMPONENT (INLINE)
// ═══════════════════════════════════════════════════════════════════════════

function InlineToast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-xl shadow-2xl',
        'bg-slate-900/95 max-w-sm',
        styles[toast.type],
        'login-form-enter'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{toast.title}</p>
          {toast.description && (
            <p className="text-slate-400 text-sm mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [shakeForm, setShakeForm] = useState(false);
  const [devLoading, setDevLoading] = useState<string | null>(null);
  const [showDevMode, setShowDevMode] = useState(true);
  
  // Toast state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'info',
    title: '',
  });

  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Inject styles on mount
  useEffect(() => {
    injectLoginStyles();
  }, []);

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  // Real-time validation on blur
  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Clear error on change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email && errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password && errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setTouched({ email: true, password: true });
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Handle specific error types
        let errorMessage = 'An error occurred during login';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please try again later';
        } else {
          errorMessage = error.message;
        }

        setErrors({ general: errorMessage });
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 500);
        
        setToast({
          show: true,
          type: 'error',
          title: 'Login Failed',
          description: errorMessage,
        });
        
        return;
      }

      if (data.user) {
        // Success!
        setIsSuccess(true);
        setToast({
          show: true,
          type: 'success',
          title: 'Welcome back!',
          description: 'Redirecting to your dashboard...',
        });

        // Redirect after animation
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      setErrors({ general: errorMessage });
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      
      setToast({
        show: true,
        type: 'error',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DEV MODE LOGIN
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDevLogin = (account: typeof DEV_ACCOUNTS[0]) => {
    setDevLoading(account.id);
    
    // Set cookies for middleware (cookies work with SSR/middleware, localStorage doesn't)
    document.cookie = `dev_mode=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    document.cookie = `dev_role=${account.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    
    // Also set localStorage for client-side checks
    localStorage.setItem('dev_role', account.id);
    localStorage.setItem('dev_mode', 'true');

    setToast({
      show: true,
      type: 'success',
      title: `Logging in as ${account.label}`,
      description: 'Redirecting...',
    });

    setTimeout(() => {
      router.push(account.path);
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8">
      {/* Toast Notification */}
      <InlineToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        <div
          className={cn(
            'bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl',
            'login-form-enter',
            shakeForm && 'login-shake',
            isSuccess && 'login-success-glow'
          )}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-white inline-block mb-2">
              Scout<span className="text-emerald-500">Pulse</span>
            </Link>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 login-success-check" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Welcome back!</h3>
              <p className="text-slate-400">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              {/* Login Form */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* General Error */}
                {errors.general && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 field-error-enter">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-red-400 text-sm">{errors.general}</p>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      disabled={isLoading}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={cn(
                        'w-full h-12 pl-10 pr-4 rounded-xl',
                        'bg-white/5 backdrop-blur-sm border text-white placeholder-slate-500',
                        'focus:outline-none focus:ring-2 transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        errors.email && touched.email
                          ? 'border-red-500/50 focus:ring-red-500/30'
                          : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30'
                      )}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1.5 field-error-enter">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      disabled={isLoading}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        'w-full h-12 pl-10 pr-12 rounded-xl',
                        'bg-white/5 backdrop-blur-sm border text-white placeholder-slate-500',
                        'focus:outline-none focus:ring-2 transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        errors.password && touched.password
                          ? 'border-red-500/50 focus:ring-red-500/30'
                          : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg',
                        'text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="text-red-400 text-sm flex items-center gap-1.5 field-error-enter">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 rounded-xl font-semibold text-white',
                    'bg-emerald-500 hover:bg-emerald-600 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2',
                    'hover:scale-[1.02] active:scale-[0.98]'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-500">or continue with</span>
                </div>
              </div>

              {/* Dev Mode Toggle */}
              <button
                type="button"
                onClick={() => setShowDevMode(!showDevMode)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors mb-4"
              >
                {showDevMode ? 'Hide' : 'Show'} Development Mode
              </button>

              {/* Dev Mode Accounts */}
              {showDevMode && (
                <div className="space-y-3">
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-400 text-center">⚡ Development Mode</p>
                  </div>

                  {DEV_ACCOUNTS.map((account) => {
                    const Icon = account.icon;
                    const isDevLoading = devLoading === account.id;

                    return (
                      <button
                        key={account.id}
                        onClick={() => handleDevLogin(account)}
                        disabled={devLoading !== null || isLoading}
                        className={cn(
                          'w-full p-4 rounded-xl border transition-all duration-200',
                          'flex items-center gap-4 text-left',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'hover:scale-[1.02] active:scale-[0.98]',
                          account.color
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', account.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{account.label}</p>
                          <p className="text-xs text-slate-400">{account.description}</p>
                        </div>
                        {isDevLoading && (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sign Up Link */}
              <p className="text-center text-slate-400 text-sm mt-8">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
