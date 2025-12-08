'use client';

import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDevMode, DEV_ENTITY_IDS, getDevRole } from '@/lib/dev-mode';
import { Loader2, ShieldX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'player' | 'coach' | 'admin';
export type CoachRole = 'college' | 'high_school' | 'juco' | 'showcase';
export type AuthErrorReason = 'role' | 'session_expired' | 'not_authenticated' | 'coach_type' | 'unknown';

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Allowed user roles (player, coach, admin) */
  allowedRoles: UserRole[];
  /** Allowed coach types (only applies when role is 'coach') */
  allowedCoachTypes?: CoachRole[];
  /** Redirect URL when not authenticated (defaults to /auth/login) */
  loginRedirect?: string;
  /** Redirect URL when unauthorized (defaults to /unauthorized) */
  unauthorizedRedirect?: string;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom unauthorized component (if not provided, redirects to unauthorized page) */
  unauthorizedComponent?: ReactNode;
  /** Show inline unauthorized message instead of redirecting */
  showInlineUnauthorized?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  role: UserRole | null;
  coachType: CoachRole | null;
  userType: string | null; // raw userType from database
  loading: boolean;
  error: AuthErrorReason | null;
  sessionExpired: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeCoachType(type: string | null): CoachRole | null {
  if (!type) return null;
  const normalized = type.toLowerCase().replace(/-/g, '_');
  if (['college', 'high_school', 'juco', 'showcase'].includes(normalized)) {
    return normalized as CoachRole;
  }
  return null;
}

function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (['player', 'coach', 'admin'].includes(normalized)) {
    return normalized as UserRole;
  }
  return null;
}

function buildUnauthorizedUrl(
  baseUrl: string,
  reason: AuthErrorReason,
  returnPath: string,
  requiredRole?: string,
  userRole?: string | null
): string {
  const params = new URLSearchParams();
  params.set('reason', reason);
  params.set('return', returnPath);
  if (requiredRole) params.set('required_role', requiredRole);
  if (userRole) params.set('user_role', userRole);
  return `${baseUrl}?${params.toString()}`;
}

// Session expiry check - tokens typically expire after this time without refresh
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before expiry

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedCoachTypes,
  loginRedirect = '/auth/login',
  unauthorizedRedirect = '/unauthorized',
  loadingComponent,
  unauthorizedComponent,
  showInlineUnauthorized = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthorized: false,
    role: null,
    coachType: null,
    userType: null,
    loading: true,
    error: null,
    sessionExpired: false,
  });
  const [retrying, setRetrying] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH CHECK FUNCTION
  // ═══════════════════════════════════════════════════════════════════════
  
  const checkAuth = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    
    const supabase = createClient();

    try {
      // ═══════════════════════════════════════════════════════════════════
      // DEV MODE BYPASS
      // ═══════════════════════════════════════════════════════════════════
      if (isDevMode()) {
        const devRole = getDevRole();
        
        // Determine role from dev mode
        let role: UserRole = 'coach';
        let coachType: CoachRole | null = null;
        
        if (devRole === 'player') {
          role = 'player';
        } else {
          role = 'coach';
          coachType = devRole === 'high-school' ? 'high_school' 
            : devRole === 'juco' ? 'juco'
            : devRole === 'showcase' ? 'showcase'
            : 'college';
        }

        const isRoleAllowed = allowedRoles.includes(role);
        const isCoachTypeAllowed = role !== 'coach' || 
          !allowedCoachTypes || 
          allowedCoachTypes.length === 0 ||
          Boolean(coachType && allowedCoachTypes.includes(coachType));

        const isAuthorized = isRoleAllowed && isCoachTypeAllowed;

        setAuthState({
          isAuthenticated: true,
          isAuthorized,
          role,
          coachType,
          userType: role,
          loading: false,
          error: isAuthorized ? null : (isRoleAllowed ? 'coach_type' : 'role'),
          sessionExpired: false,
        });

        if (!isAuthorized && !showInlineUnauthorized) {
          const reason = isRoleAllowed ? 'coach_type' : 'role';
          router.push(buildUnauthorizedUrl(
            unauthorizedRedirect,
            reason,
            pathname || '/',
            allowedRoles.join(', '),
            role
          ));
        }
        
        setRetrying(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // CHECK SESSION STATUS
      // ═══════════════════════════════════════════════════════════════════
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Handle session errors (including expired sessions)
      if (sessionError) {
        console.error('Session error:', sessionError);
        
        // Check if this is an expired session error
        const isExpired = sessionError.message?.toLowerCase().includes('expired') ||
                         sessionError.message?.toLowerCase().includes('invalid') ||
                         sessionError.message?.toLowerCase().includes('refresh');

        setAuthState({
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: null,
          loading: false,
          error: isExpired ? 'session_expired' : 'not_authenticated',
          sessionExpired: isExpired,
        });

        if (!showInlineUnauthorized) {
          if (isExpired) {
            router.push(buildUnauthorizedUrl(
              unauthorizedRedirect,
              'session_expired',
              pathname || '/'
            ));
          } else {
            router.push(`${loginRedirect}?redirect=${encodeURIComponent(pathname || '/')}`);
          }
        }
        
        setRetrying(false);
        return;
      }

      // No session - not authenticated
      if (!session || !session.user) {
        setAuthState({
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: null,
          loading: false,
          error: 'not_authenticated',
          sessionExpired: false,
        });

        if (!showInlineUnauthorized) {
          router.push(`${loginRedirect}?redirect=${encodeURIComponent(pathname || '/')}`);
        }
        
        setRetrying(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // CHECK SESSION EXPIRY
      // ═══════════════════════════════════════════════════════════════════
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiryTime = expiresAt * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        // Session is already expired
        if (timeUntilExpiry <= 0) {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            setAuthState({
              isAuthenticated: false,
              isAuthorized: false,
              role: null,
              coachType: null,
              userType: null,
              loading: false,
              error: 'session_expired',
              sessionExpired: true,
            });

            if (!showInlineUnauthorized) {
              router.push(buildUnauthorizedUrl(
                unauthorizedRedirect,
                'session_expired',
                pathname || '/'
              ));
            }
            
            setRetrying(false);
            return;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // GET USER PROFILE AND VALIDATE ROLE
      // ═══════════════════════════════════════════════════════════════════
      const user = session.user;
      
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, user_type')
        .eq('id', user.id)
        .maybeSingle();

      // Handle profile fetch errors
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setAuthState({
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: null,
          loading: false,
          error: 'unknown',
          sessionExpired: false,
        });

        if (!showInlineUnauthorized) {
          router.push(buildUnauthorizedUrl(
            unauthorizedRedirect,
            'unknown',
            pathname || '/'
          ));
        }
        
        setRetrying(false);
        return;
      }

      // No profile found - user may not be fully set up
      if (!profile) {
        setAuthState({
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: null,
          loading: false,
          error: 'role',
          sessionExpired: false,
        });

        if (!showInlineUnauthorized) {
          router.push(`${loginRedirect}?redirect=${encodeURIComponent(pathname || '/')}`);
        }
        
        setRetrying(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // VALIDATE USER ROLE AGAINST ALLOWED ROLES
      // ═══════════════════════════════════════════════════════════════════
      // Check both 'role' and 'user_type' fields for compatibility
      const rawUserType = profile.user_type || profile.role;
      const userRole = normalizeUserRole(rawUserType);

      if (!userRole) {
        setAuthState({
          isAuthenticated: true,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: rawUserType,
          loading: false,
          error: 'role',
          sessionExpired: false,
        });

        if (!showInlineUnauthorized) {
          router.push(buildUnauthorizedUrl(
            unauthorizedRedirect,
            'role',
            pathname || '/',
            allowedRoles.join(', '),
            rawUserType
          ));
        }
        
        setRetrying(false);
        return;
      }

      // Check if user role is in allowed roles array
      const isRoleAllowed = allowedRoles.includes(userRole);

      if (!isRoleAllowed) {
        setAuthState({
          isAuthenticated: true,
          isAuthorized: false,
          role: userRole,
          coachType: null,
          userType: rawUserType,
          loading: false,
          error: 'role',
          sessionExpired: false,
        });

        if (!showInlineUnauthorized) {
          router.push(buildUnauthorizedUrl(
            unauthorizedRedirect,
            'role',
            pathname || '/',
            allowedRoles.join(', '),
            userRole
          ));
        }
        
        setRetrying(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // VALIDATE COACH TYPE (if user is a coach)
      // ═══════════════════════════════════════════════════════════════════
      let coachType: CoachRole | null = null;

      if (userRole === 'coach') {
        const { data: coach, error: coachError } = await supabase
          .from('coaches')
          .select('coach_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (coachError) {
          console.error('Coach fetch error:', coachError);
        }
        
        coachType = normalizeCoachType(coach?.coach_type || null);

        // Check coach type if specified
        if (allowedCoachTypes && allowedCoachTypes.length > 0) {
          const isCoachTypeAllowed = coachType && allowedCoachTypes.includes(coachType);

          if (!isCoachTypeAllowed) {
            setAuthState({
              isAuthenticated: true,
              isAuthorized: false,
              role: userRole,
              coachType,
              userType: rawUserType,
              loading: false,
              error: 'coach_type',
              sessionExpired: false,
            });

            if (!showInlineUnauthorized) {
              router.push(buildUnauthorizedUrl(
                unauthorizedRedirect,
                'coach_type',
                pathname || '/',
                allowedCoachTypes.join(', '),
                coachType || 'unknown'
              ));
            }
            
            setRetrying(false);
            return;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // USER IS AUTHORIZED
      // ═══════════════════════════════════════════════════════════════════
      setAuthState({
        isAuthenticated: true,
        isAuthorized: true,
        role: userRole,
        coachType,
        userType: rawUserType,
        loading: false,
        error: null,
        sessionExpired: false,
      });
      
      setRetrying(false);

    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Check if error indicates session expiry
      const errorMessage = error instanceof Error ? error.message : '';
      const isSessionError = errorMessage.toLowerCase().includes('session') ||
                            errorMessage.toLowerCase().includes('token') ||
                            errorMessage.toLowerCase().includes('expired');

      setAuthState({
        isAuthenticated: false,
        isAuthorized: false,
        role: null,
        coachType: null,
        userType: null,
        loading: false,
        error: isSessionError ? 'session_expired' : 'unknown',
        sessionExpired: isSessionError,
      });

      if (!showInlineUnauthorized) {
        if (isSessionError) {
          router.push(buildUnauthorizedUrl(
            unauthorizedRedirect,
            'session_expired',
            pathname || '/'
          ));
        } else {
          router.push(`${loginRedirect}?redirect=${encodeURIComponent(pathname || '/')}`);
        }
      }
      
      setRetrying(false);
    }
  }, [allowedRoles, allowedCoachTypes, loginRedirect, unauthorizedRedirect, pathname, router, showInlineUnauthorized]);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up session monitoring for expiry
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const supabase = createClient();

    // Listen for auth state changes (including session expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            isAuthorized: false,
            sessionExpired: true,
            error: 'session_expired',
          }));
          
          if (!showInlineUnauthorized) {
            router.push(buildUnauthorizedUrl(
              unauthorizedRedirect,
              'session_expired',
              pathname || '/'
            ));
          }
        }
      }
    });

    // Periodic session check
    const intervalId = setInterval(() => {
      checkAuth();
    }, SESSION_CHECK_INTERVAL);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [authState.isAuthenticated, checkAuth, pathname, router, showInlineUnauthorized, unauthorizedRedirect]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════════════════

  // Loading state
  if (authState.loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state (inline display)
  if (!authState.isAuthorized && showInlineUnauthorized) {
    return unauthorizedComponent || (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md px-4">
          <div className="p-4 rounded-2xl bg-red-500/10 w-fit mx-auto mb-4">
            <ShieldX className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {authState.sessionExpired ? 'Session Expired' : 'Access Denied'}
          </h1>
          <p className="text-slate-400 mb-6">
            {authState.sessionExpired 
              ? 'Your session has expired. Please log in again to continue.'
              : 'You don\'t have permission to access this page.'
            }
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => checkAuth(true)}
              disabled={retrying}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {retrying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Try Again
            </Button>
            <Button
              onClick={() => router.push(authState.sessionExpired ? loginRedirect : '/')}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              {authState.sessionExpired ? 'Sign In' : 'Go Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  if (authState.isAuthorized) {
    return <>{children}</>;
  }

  // Fallback loading while redirecting
  return loadingComponent || (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Protect routes for players only */
export function PlayerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['player']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for coaches only */
export function CoachRoute({ 
  children, 
  allowedCoachTypes,
  ...props 
}: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      allowedCoachTypes={allowedCoachTypes}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for high school coaches */
export function HSCoachRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles' | 'allowedCoachTypes'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      allowedCoachTypes={['high_school']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for JUCO coaches */
export function JUCOCoachRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles' | 'allowedCoachTypes'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      allowedCoachTypes={['juco']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for college coaches */
export function CollegeCoachRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles' | 'allowedCoachTypes'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      allowedCoachTypes={['college']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for showcase coaches */
export function ShowcaseCoachRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles' | 'allowedCoachTypes'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      allowedCoachTypes={['showcase']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for any coach type */
export function AnyCoachRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['coach']} 
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

/** Protect routes for admins only */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute 
      allowedRoles={['admin']} 
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK FOR CHECKING AUTH STATE
// ═══════════════════════════════════════════════════════════════════════════

export function useProtectedRoute(allowedRoles: UserRole[], allowedCoachTypes?: CoachRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthorized: false,
    role: null,
    coachType: null,
    userType: null,
    loading: true,
    error: null,
    sessionExpired: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      try {
        if (isDevMode()) {
          const devRole = getDevRole();
          let role: UserRole = 'coach';
          let coachType: CoachRole | null = null;

          if (devRole === 'player') {
            role = 'player';
          } else {
            role = 'coach';
            coachType = devRole === 'high-school' ? 'high_school'
              : devRole === 'juco' ? 'juco'
              : devRole === 'showcase' ? 'showcase'
              : 'college';
          }

          const isRoleAllowed = allowedRoles.includes(role);
          const isCoachTypeAllowed = role !== 'coach' ||
            !allowedCoachTypes ||
            allowedCoachTypes.length === 0 ||
            Boolean(coachType && allowedCoachTypes.includes(coachType));

          setAuthState({
            isAuthenticated: true,
            isAuthorized: isRoleAllowed && isCoachTypeAllowed,
            role,
            coachType,
            userType: role,
            loading: false,
            error: (isRoleAllowed && isCoachTypeAllowed) ? null : 'role',
            sessionExpired: false,
          });
          return;
        }

        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          const isExpired = sessionError?.message?.toLowerCase().includes('expired');
          setAuthState({
            isAuthenticated: false,
            isAuthorized: false,
            role: null,
            coachType: null,
            userType: null,
            loading: false,
            error: isExpired ? 'session_expired' : 'not_authenticated',
            sessionExpired: isExpired || false,
          });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type')
          .eq('id', session.user.id)
          .maybeSingle();

        const rawUserType = profile?.user_type || profile?.role;
        const userRole = normalizeUserRole(rawUserType);
        let coachType: CoachRole | null = null;

        if (userRole === 'coach') {
          const { data: coach } = await supabase
            .from('coaches')
            .select('coach_type')
            .eq('user_id', session.user.id)
            .maybeSingle();
          coachType = normalizeCoachType(coach?.coach_type || null);
        }

        const isRoleAllowed = userRole ? allowedRoles.includes(userRole) : false;
        const isCoachTypeAllowed = userRole !== 'coach' ||
          !allowedCoachTypes ||
          allowedCoachTypes.length === 0 ||
          Boolean(coachType && allowedCoachTypes.includes(coachType));

        setAuthState({
          isAuthenticated: true,
          isAuthorized: isRoleAllowed && isCoachTypeAllowed,
          role: userRole,
          coachType,
          userType: rawUserType,
          loading: false,
          error: (isRoleAllowed && isCoachTypeAllowed) ? null : (isRoleAllowed ? 'coach_type' : 'role'),
          sessionExpired: false,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        const errorMessage = error instanceof Error ? error.message : '';
        const isSessionError = errorMessage.toLowerCase().includes('session') ||
                              errorMessage.toLowerCase().includes('expired');
        
        setAuthState({
          isAuthenticated: false,
          isAuthorized: false,
          role: null,
          coachType: null,
          userType: null,
          loading: false,
          error: isSessionError ? 'session_expired' : 'unknown',
          sessionExpired: isSessionError,
        });
      }
    };

    checkAuth();
  }, [allowedRoles, allowedCoachTypes]);

  return authState;
}

export default ProtectedRoute;
