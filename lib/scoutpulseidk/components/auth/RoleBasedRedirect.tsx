'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDevMode, getDevRole } from '@/lib/dev-mode';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserType = 'player' | 'coach' | 'admin';
export type CoachType = 'college' | 'high_school' | 'juco' | 'showcase';

export interface RoleBasedRedirectProps {
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Fallback if user is not authenticated */
  unauthenticatedFallback?: ReactNode;
  /** Override default redirects */
  redirectMap?: Partial<Record<UserType | CoachType, string>>;
  /** Default redirect if role can't be determined */
  defaultRedirect?: string;
}

interface RedirectState {
  loading: boolean;
  isAuthenticated: boolean;
  targetPath: string | null;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT REDIRECT MAP
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_REDIRECTS: Record<string, string> = {
  // User types
  player: '/player/dashboard',
  coach: '/coach/college', // Default coach redirect (will be overridden by coach type)
  admin: '/admin/dashboard',
  
  // Coach types (more specific)
  college: '/coach/college',
  high_school: '/coach/high-school',
  juco: '/coach/juco',
  showcase: '/coach/showcase',
  
  // Legacy aliases
  'hs-coach': '/coach/high-school',
  'hs_coach': '/coach/high-school',
  'high-school': '/coach/high-school',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeCoachType(type: string | null): CoachType | null {
  if (!type) return null;
  const normalized = type.toLowerCase().replace(/-/g, '_');
  if (['college', 'high_school', 'juco', 'showcase'].includes(normalized)) {
    return normalized as CoachType;
  }
  return null;
}

function normalizeUserType(type: string | null | undefined): UserType | null {
  if (!type) return null;
  const normalized = type.toLowerCase();
  if (['player', 'coach', 'admin'].includes(normalized)) {
    return normalized as UserType;
  }
  return null;
}

function getRedirectPath(
  userType: UserType | null,
  coachType: CoachType | null,
  customRedirects?: Partial<Record<string, string>>
): string {
  const redirectMap = { ...DEFAULT_REDIRECTS, ...customRedirects };

  // For coaches, prioritize coach type over generic coach redirect
  if (userType === 'coach' && coachType) {
    return redirectMap[coachType] || redirectMap.coach || '/coach/college';
  }

  // For other user types
  if (userType) {
    return redirectMap[userType] || '/';
  }

  return '/';
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE BASED REDIRECT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RoleBasedRedirect({
  loadingComponent,
  unauthenticatedFallback,
  redirectMap,
  defaultRedirect = '/',
}: RoleBasedRedirectProps) {
  const router = useRouter();
  const [state, setState] = useState<RedirectState>({
    loading: true,
    isAuthenticated: false,
    targetPath: null,
    error: null,
  });

  useEffect(() => {
    const determineRedirect = async () => {
      const supabase = createClient();

      try {
        // ═══════════════════════════════════════════════════════════════════
        // DEV MODE BYPASS
        // ═══════════════════════════════════════════════════════════════════
        if (isDevMode()) {
          const devRole = getDevRole();
          
          let userType: UserType = 'coach';
          let coachType: CoachType | null = null;
          
          if (devRole === 'player') {
            userType = 'player';
          } else {
            userType = 'coach';
            coachType = devRole === 'high-school' ? 'high_school' 
              : devRole === 'juco' ? 'juco'
              : devRole === 'showcase' ? 'showcase'
              : 'college';
          }

          const targetPath = getRedirectPath(userType, coachType, redirectMap);
          
          setState({
            loading: false,
            isAuthenticated: true,
            targetPath,
            error: null,
          });

          router.replace(targetPath);
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // CHECK SESSION
        // ═══════════════════════════════════════════════════════════════════
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setState({
            loading: false,
            isAuthenticated: false,
            targetPath: null,
            error: sessionError?.message || 'Not authenticated',
          });
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET USER PROFILE
        // ═══════════════════════════════════════════════════════════════════
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_type')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setState({
            loading: false,
            isAuthenticated: true,
            targetPath: defaultRedirect,
            error: 'Could not fetch profile',
          });
          router.replace(defaultRedirect);
          return;
        }

        // Determine user type from profile
        const rawUserType = profile?.user_type || profile?.role;
        const userType = normalizeUserType(rawUserType);

        if (!userType) {
          // No user type found, redirect to default
          setState({
            loading: false,
            isAuthenticated: true,
            targetPath: defaultRedirect,
            error: null,
          });
          router.replace(defaultRedirect);
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET COACH TYPE (if user is coach)
        // ═══════════════════════════════════════════════════════════════════
        let coachType: CoachType | null = null;

        if (userType === 'coach') {
          const { data: coach } = await supabase
            .from('coaches')
            .select('coach_type')
            .eq('user_id', session.user.id)
            .maybeSingle();

          coachType = normalizeCoachType(coach?.coach_type || null);
        }

        // ═══════════════════════════════════════════════════════════════════
        // DETERMINE & EXECUTE REDIRECT
        // ═══════════════════════════════════════════════════════════════════
        const targetPath = getRedirectPath(userType, coachType, redirectMap);

        setState({
          loading: false,
          isAuthenticated: true,
          targetPath,
          error: null,
        });

        router.replace(targetPath);

      } catch (error) {
        console.error('Redirect determination failed:', error);
        setState({
          loading: false,
          isAuthenticated: false,
          targetPath: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    determineRedirect();
  }, [router, redirectMap, defaultRedirect]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════════════════

  // Loading state
  if (state.loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!state.isAuthenticated) {
    return unauthenticatedFallback || (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md px-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 w-fit mx-auto mb-4">
            <LogIn className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to ScoutPulse
          </h1>
          <p className="text-slate-400 mb-6">
            Sign in to access your personalized dashboard
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/login">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button 
                variant="outline" 
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirecting state
  return loadingComponent || (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">
          Redirecting to {state.targetPath || 'dashboard'}...
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK VERSION FOR PROGRAMMATIC USE
// ═══════════════════════════════════════════════════════════════════════════

export function useRoleBasedRedirect(
  redirectMap?: Partial<Record<string, string>>,
  options?: {
    autoRedirect?: boolean;
    defaultRedirect?: string;
  }
) {
  const router = useRouter();
  const [state, setState] = useState<{
    loading: boolean;
    userType: UserType | null;
    coachType: CoachType | null;
    targetPath: string | null;
    isAuthenticated: boolean;
  }>({
    loading: true,
    userType: null,
    coachType: null,
    targetPath: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const determine = async () => {
      const supabase = createClient();

      try {
        // Dev mode
        if (isDevMode()) {
          const devRole = getDevRole();
          let userType: UserType = 'coach';
          let coachType: CoachType | null = null;

          if (devRole === 'player') {
            userType = 'player';
          } else {
            userType = 'coach';
            coachType = devRole === 'high-school' ? 'high_school'
              : devRole === 'juco' ? 'juco'
              : devRole === 'showcase' ? 'showcase'
              : 'college';
          }

          const targetPath = getRedirectPath(userType, coachType, redirectMap);
          setState({
            loading: false,
            userType,
            coachType,
            targetPath,
            isAuthenticated: true,
          });

          if (options?.autoRedirect !== false) {
            router.replace(targetPath);
          }
          return;
        }

        // Production
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setState({
            loading: false,
            userType: null,
            coachType: null,
            targetPath: null,
            isAuthenticated: false,
          });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type')
          .eq('id', session.user.id)
          .maybeSingle();

        const userType = normalizeUserType(profile?.user_type || profile?.role);
        let coachType: CoachType | null = null;

        if (userType === 'coach') {
          const { data: coach } = await supabase
            .from('coaches')
            .select('coach_type')
            .eq('user_id', session.user.id)
            .maybeSingle();
          coachType = normalizeCoachType(coach?.coach_type || null);
        }

        const targetPath = getRedirectPath(userType, coachType, redirectMap);
        
        setState({
          loading: false,
          userType,
          coachType,
          targetPath,
          isAuthenticated: true,
        });

        if (options?.autoRedirect !== false) {
          router.replace(targetPath);
        }
      } catch (error) {
        console.error('Role determination failed:', error);
        setState({
          loading: false,
          userType: null,
          coachType: null,
          targetPath: options?.defaultRedirect || '/',
          isAuthenticated: false,
        });
      }
    };

    determine();
  }, [router, redirectMap, options?.autoRedirect, options?.defaultRedirect]);

  return {
    ...state,
    redirect: () => {
      if (state.targetPath) {
        router.replace(state.targetPath);
      }
    },
  };
}

export default RoleBasedRedirect;
