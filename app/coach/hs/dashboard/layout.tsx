'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo, ReactNode, useEffect } from 'react';
import { useCurrentCoach } from '@/lib/hooks/useCurrentCoach';
import { useCurrentHighSchoolOrg } from '@/lib/hooks/useCurrentHighSchoolOrg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

const TABS = [
  { label: 'Overview', href: '/coach/hs/dashboard' },
  { label: 'Roster', href: '/coach/hs/dashboard/roster' },
  { label: 'Schedule', href: '/coach/hs/dashboard/schedule' },
  { label: 'Messaging', href: '/coach/hs/dashboard/messaging' },
  { label: 'Settings', href: '/coach/hs/dashboard/settings' },
];

export default function HsCoachDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { coachProfile, isLoading: loadingCoach } = useCurrentCoach();
  const { org, isLoading: loadingOrg } = useCurrentHighSchoolOrg(coachProfile?.id);

  const active = useMemo(
    () => TABS.find((tab) => pathname === tab.href)?.href || '/coach/hs/dashboard',
    [pathname]
  );

  useEffect(() => {
    if (!loadingCoach && coachProfile === null) {
      router.replace('/login');
    }
  }, [loadingCoach, coachProfile, router]);

  if (loadingCoach || loadingOrg) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-6 text-white">
        <p className="text-sm text-slate-300">No high school organization linked yet.</p>
      </Card>
    );
  }

  const initials = org.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#060a15] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/10">
              <AvatarImage src={org.logo_url || undefined} alt={org.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="text-sm text-slate-400">High School Coach Dashboard</p>
            </div>
          </div>
          <Tabs value={active} className="w-full">
            <TabsList className="bg-slate-900/70 border border-white/10 w-full justify-start overflow-x-auto">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.href}
                  value={tab.href}
                  className="data-[state=active]:bg-white/10"
                >
                  <Link href={tab.href} className="px-2 py-1 block">
                    {tab.label}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {children}
      </div>
    </div>
  );
}
