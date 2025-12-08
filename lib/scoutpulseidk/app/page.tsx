'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Video, Compass, Users, Loader2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { isDevMode, getDevRole } from '@/lib/dev-mode';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type UserType = 'player' | 'coach' | 'admin';
type CoachType = 'college' | 'high_school' | 'juco' | 'showcase';

// ═══════════════════════════════════════════════════════════════════════════
// REDIRECT MAP
// ═══════════════════════════════════════════════════════════════════════════

const DASHBOARD_REDIRECTS: Record<string, string> = {
  // User types
  player: '/player/dashboard',
  coach: '/coach/college', // Default coach redirect
  admin: '/admin/dashboard',
  
  // Coach types (more specific)
  college: '/coach/college',
  high_school: '/coach/high-school',
  juco: '/coach/juco',
  showcase: '/coach/showcase',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
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

function getDashboardPath(userType: UserType | null, coachType: CoachType | null): string {
  if (userType === 'coach' && coachType) {
    return DASHBOARD_REDIRECTS[coachType] || DASHBOARD_REDIRECTS.coach;
  }
  if (userType) {
    return DASHBOARD_REDIRECTS[userType] || '/';
  }
  return '/';
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createClient();

      try {
        // ═══════════════════════════════════════════════════════════════════
        // DEV MODE - Redirect based on dev role
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

          const targetPath = getDashboardPath(userType, coachType);
          setIsAuthenticated(true);
          router.replace(targetPath);
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PRODUCTION - Check if user is logged in
        // ═══════════════════════════════════════════════════════════════════
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not authenticated - show landing page
          setChecking(false);
          setIsAuthenticated(false);
          return;
        }

        // User is authenticated - determine where to redirect
        setIsAuthenticated(true);

        // Get user profile to determine user type
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type')
          .eq('id', session.user.id)
          .maybeSingle();

        const rawUserType = profile?.user_type || profile?.role;
        const userType = normalizeUserType(rawUserType);

        // Get coach type if user is a coach
        let coachType: CoachType | null = null;
        if (userType === 'coach') {
          const { data: coach } = await supabase
            .from('coaches')
            .select('coach_type')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          coachType = normalizeCoachType(coach?.coach_type || null);
        }

        // Redirect to appropriate dashboard
        const targetPath = getDashboardPath(userType, coachType);
        router.replace(targetPath);

      } catch (error) {
        console.error('Auth check error:', error);
        setChecking(false);
        setIsAuthenticated(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE - while checking auth
  // ═══════════════════════════════════════════════════════════════════════
  if (checking || isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#111] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">
            {isAuthenticated ? 'Redirecting to your dashboard...' : 'Loading...'}
          </p>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LANDING PAGE - for unauthenticated users
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#111] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 border-b border-white/5 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              Scout<span className="text-blue-500">Pulse</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#for-players" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                For Players
              </a>
              <a href="#for-coaches" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                For Coaches
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Button asChild variant="gradient" size="sm">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="mx-auto max-w-5xl px-6 pt-28 pb-24 text-center">
        <Badge className="mb-6 bg-white/10 text-white px-4 py-1 border-white/20">
          For high school, showcase, JUCO & college baseball
        </Badge>

        <h1 className="text-5xl sm:text-6xl font-bold mb-6">
          Recruiting. Reimagined.
        </h1>

        <p className="text-lg text-gray-300 max-w-xl mx-auto mb-10">
          ScoutPulse helps players showcase their talent and coaches discover,
          evaluate, and recruit — all in one modern, AI-powered platform.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/signup?role=player">
            <Button size="lg" className="bg-[#FF8A00] hover:bg-[#ff9e2f] text-white">
              I&apos;m a Player →
            </Button>
          </Link>

          <Link href="/auth/signup?role=coach">
            <Button size="lg" className="bg-[#00C27A] hover:bg-[#1ad692] text-white">
              I&apos;m a Coach →
            </Button>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <Feature icon={<Shield className="w-6 h-6 text-emerald-400" />} title="Verified Profiles" />
          <Feature icon={<Compass className="w-6 h-6 text-blue-400" />} title="AI-Powered Discovery" />
          <Feature icon={<Video className="w-6 h-6 text-cyan-400" />} title="Video Highlights" />
          <Feature icon={<Users className="w-6 h-6 text-purple-400" />} title="All Levels Supported" />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <Link href="/" className="text-2xl font-bold text-white mb-2 inline-block">
              Scout<span className="text-blue-500">Pulse</span>
            </Link>
            <p className="text-sm text-muted-foreground">Modern. Simple. Trusted.</p>
          </div>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-white/5">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ScoutPulse. Built to help serious athletes and serious programs connect.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="p-4 bg-white/10 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
        {icon}
      </div>
      <p className="text-lg font-medium">{title}</p>
    </div>
  );
}
