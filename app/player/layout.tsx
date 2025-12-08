'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { LogOut, User, Search, Users, MessageSquare, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isDevMode, DEV_ENTITY_IDS, clearDevMode } from '@/lib/dev-mode';
import { NotificationBell } from '@/components/NotificationBell';
import { QuickActionToolbar } from '@/components/ui/QuickActionToolbar';

export default function PlayerLayout({
  children,
}: {
   children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    
    // Dev mode bypass
    if (isDevMode()) {
      const { data: playerData } = await supabase
        .from('players')
        .select('first_name, last_name, full_name')
        .eq('id', DEV_ENTITY_IDS.player)
        .single();
      
      if (playerData) {
        setPlayerName(playerData.full_name || `${playerData.first_name || ''} ${playerData.last_name || ''}`.trim() || 'Dev Player');
      } else {
        setPlayerName('Dev Player');
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
    
    if (!profile || profile.role !== 'player') {
      router.push('/auth/login');
      return;
    }
    
    const { data: playerData } = await supabase
      .from('players')
      .select('first_name, last_name, onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!playerData?.onboarding_completed) {
      router.push('/onboarding/player');
      return;
    }
    
    setPlayerName(`${playerData.first_name || ''} ${playerData.last_name || ''}`.trim() || 'Player');
    setLoading(false);
  };

  const handleSignOut = async () => {
    clearDevMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1720] flex items-center justify-center">
        <div className="w-8 h-8 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  const navItems = [
    { href: '/player', label: 'Profile', icon: User },
    { href: '/player/journey', label: 'Journey', icon: Compass },
    { href: '/player/discover', label: 'Discover', icon: Search },
    { href: '/player/team', label: 'Team', icon: Users },
    { href: '/player/messages', label: 'Messages', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/player') return pathname === '/player';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#0b1720]">
      {/* Header - Dark glass nav */}
      <header className="sticky top-0 z-50 bg-[#0a0f14]/90 border-b border-white/[0.06] backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 md:gap-8">
              <Link href="/player" className="text-xl font-bold text-white tracking-tight">
                Scout<span className="text-emerald-400">Pulse</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive(item.href)
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-white/60 hidden sm:block font-medium">
                {playerName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-white/70 hover:text-white hover:bg-white/[0.05]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f14]/95 border-t border-white/[0.06] backdrop-blur-xl z-50 safe-area-pb">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150 ${
                isActive(item.href)
                  ? 'text-emerald-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Quick Action Toolbar */}
      <QuickActionToolbar position="right" userRole="player" />
    </div>
  );
}
