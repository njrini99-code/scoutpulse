'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Video, Compass, Users } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { isDevMode, getDevRole } from '@/lib/dev-mode';
import { logError } from '@/lib/utils/errorLogger';
import { HeroSection } from '@/components/landing/HeroSection';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { SectionDivider } from '@/components/landing/SectionDivider';

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
        logError(error, { component: 'HomePage', action: 'checkAuth' });
        setChecking(false);
        setIsAuthenticated(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE - while checking auth (using shimmer skeleton)
  // ═══════════════════════════════════════════════════════════════════════
  if (checking || isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#111] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 backdrop-blur-2xl bg-white/5 border border-white/15 rounded-2xl p-8 shadow-xl">
          {/* Shimmer skeleton loader */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white/10 skeleton-shimmer" />
          </div>
          <div className="space-y-2 w-48">
            <div className="h-4 bg-white/10 rounded-lg skeleton-shimmer" />
            <div className="h-3 bg-white/5 rounded-lg skeleton-shimmer w-3/4 mx-auto" />
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {isAuthenticated ? 'Redirecting to your dashboard...' : 'Loading...'}
          </p>
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skeleton-shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 25%,
              rgba(255, 255, 255, 0.15) 50%,
              rgba(255, 255, 255, 0.05) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LANDING PAGE - for unauthenticated users
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-slate-950 text-white scroll-smooth">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 border-b border-white/5 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              Scout<span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">Pulse</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Testimonials
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2"
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
      <HeroSection />

      {/* Section Divider */}
      <SectionDivider />

      {/* FEATURES - Bento Grid */}
      <div id="features">
        <BentoGrid />
      </div>

      {/* Section Divider */}
      <SectionDivider />

      {/* TESTIMONIALS */}
      <div id="testimonials">
        <TestimonialsCarousel />
      </div>

      {/* Section Divider */}
      <SectionDivider />

      {/* FINAL CTA */}
      <FinalCTASection />

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <Link href="/" className="text-2xl font-bold text-white mb-2 inline-block">
                Scout<span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">Pulse</span>
              </Link>
              <p className="text-sm text-white/40">Modern. Simple. Trusted.</p>
            </div>
            <div className="flex items-center gap-8">
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-white/5">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} ScoutPulse. Built to help serious athletes and serious programs connect.
            </p>
          </div>
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
