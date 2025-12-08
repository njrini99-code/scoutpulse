'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Loader2, 
  LogOut, 
  Search, 
  Users, 
  MessageSquare,
  Calendar,
  Building,
  Star,
  LayoutDashboard,
  Target,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CoachType } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';
import { isDevMode, DEV_ENTITY_IDS, clearDevMode, getDevRole } from '@/lib/dev-mode';
import { NotificationBell } from '@/components/NotificationBell';
import { QuickActionToolbar } from '@/components/ui/QuickActionToolbar';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState('');
  const [coachType, setCoachType] = useState<CoachType | null>(null);
  const { isDark, toggleTheme } = useTheme();

  // All hooks must be called before any early returns
  const basePath = useMemo(() => {
    if (pathname.includes('/coach/college')) return '/coach/college';
    if (pathname.includes('/coach/juco')) return '/coach/juco';
    if (pathname.includes('/coach/high-school')) return '/coach/high-school';
    if (pathname.includes('/coach/showcase')) return '/coach/showcase';
    return '/coach';
  }, [pathname]);

  const navItems = useMemo(() => {
    const baseItems = [
      { href: basePath, label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (coachType === 'college') {
      return [
        ...baseItems,
        { href: `${basePath}/discover`, label: 'Discover', icon: Search },
        { href: `${basePath}/watchlist`, label: 'Watchlist', icon: Star },
        { href: `${basePath}/program`, label: 'Program', icon: Building },
        { href: `${basePath}/camps`, label: 'Camps', icon: Calendar },
        { href: `${basePath}/calendar`, label: 'Calendar', icon: Calendar },
        { href: `${basePath}/recruiting-planner`, label: 'Recruiting Planner', icon: Target },
        { href: `${basePath}/messages`, label: 'Messages', icon: MessageSquare },
      ];
    }

    return [
      ...baseItems,
      { href: `${basePath}/roster`, label: 'Roster', icon: Users },
      { href: `${basePath}/schedule`, label: 'Schedule', icon: Calendar },
      { href: `${basePath}/messages`, label: 'Messages', icon: MessageSquare },
    ];
  }, [basePath, coachType]);

  // Theme classes
  const theme = {
    pageBg: isDark 
      ? 'bg-slate-900' 
      : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30',
    headerBg: isDark 
      ? 'bg-slate-900/80 border-slate-800' 
      : 'bg-white/80 border-emerald-100',
    navText: isDark 
      ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50',
    navActive: isDark
      ? 'text-emerald-400 bg-slate-800'
      : 'text-emerald-600 bg-emerald-50',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    mobileNav: isDark 
      ? 'bg-slate-900/90 border-slate-800' 
      : 'bg-white/90 border-emerald-100',
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    
    // Dev mode bypass
    if (isDevMode()) {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('full_name, coach_type')
        .eq('id', DEV_ENTITY_IDS.coach)
        .single();
      
      if (coachData) {
        setCoachName(coachData.full_name || 'Dev Coach');
        // Use the dev role to determine coach type, or fall back to DB value
        const devRole = getDevRole();
        const devCoachType = devRole === 'college' ? 'college' 
          : devRole === 'high-school' ? 'high_school'
          : devRole === 'showcase' ? 'showcase'
          : devRole === 'juco' ? 'juco'
          : coachData.coach_type;
        setCoachType(devCoachType as CoachType);
      } else {
        setCoachName('Dev Coach');
        setCoachType('college');
      }
      setLoading(false);
      return;
    }
    
    // Production auth check
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || profile.role !== 'coach') {
      router.push('/auth/login');
      return;
    }
    
    const { data: coachData } = await supabase
      .from('coaches')
      .select('full_name, coach_type, onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!coachData?.onboarding_completed) {
      router.push('/onboarding/coach');
      return;
    }
    
    setCoachName(coachData.full_name || 'Coach');
    setCoachType(coachData.coach_type as CoachType);
    setLoading(false);
  };

  const handleSignOut = async () => {
    clearDevMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  // Early return AFTER all hooks
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${theme.pageBg}`}>
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.pageBg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${theme.headerBg}`}>
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                    : 'bg-white border-emerald-200 hover:bg-emerald-50 shadow-sm'
                }`}
              >
                {isDark ? (
                  <Moon className="w-4 h-4 text-slate-300" />
                ) : (
                  <Sun className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <Link href="/coach" className={`text-2xl font-bold tracking-tight ${theme.text}`}>
                Scout<span className="text-emerald-500">Pulse</span>
              </Link>
              
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== basePath && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? theme.navActive : theme.navText
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden sm:block text-right">
                <span className={`text-sm block font-medium ${theme.text}`}>{coachName}</span>
                <span className={`text-xs capitalize ${theme.textMuted}`}>
                  {coachType?.replace('_', ' ')} Coach
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-emerald-700'}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl z-50 transition-colors ${theme.mobileNav}`}>
        <div className="flex justify-around py-3">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive 
                    ? 'text-emerald-500' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 lg:pb-0">
        {children}
      </main>

      {/* Quick Action Toolbar */}
      <QuickActionToolbar position="right" userRole="coach" />
    </div>
  );
}
