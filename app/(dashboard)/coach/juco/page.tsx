'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  MessageSquare,
  Trophy,
  Edit,
  Plus,
  ChevronRight,
  Loader2,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Search,
  ArrowRightLeft,
  Eye,
  ExternalLink,
  Building2,
  Target,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Star,
  School,
  FileText,
  CalendarDays,
  Timer,
  Zap,
} from 'lucide-react';
import {
  glassCard,
  glassCardInteractive,
  glassHero,
  glassStatCard,
  glassPanel,
  glassButton,
  glassDarkZone,
  glassLightZone,
} from '@/lib/glassmorphism';
import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';
import type { Coach } from '@/lib/types';
import { getTeamForOwner, getTeamRoster, getTeamSchedule, type Team, type TeamMember, type ScheduleEvent } from '@/lib/queries/team';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { toast } from 'sonner';
import { GlassProgressBar, CircularProgress } from '@/components/ui/GlassProgressBar';

// ═══════════════════════════════════════════════════════════════════════════
// Animated Counter Hook
// ═══════════════════════════════════════════════════════════════════════════
function useCountUp(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(easeOut * end);
      setCount(countRef.current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stat Card Component
// ═══════════════════════════════════════════════════════════════════════════
function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  trend, 
  trendValue,
  iconBg,
  iconColor,
  isDark 
}: { 
  icon: React.ElementType;
  value: number | string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconBg: string;
  iconColor: string;
  isDark: boolean;
}) {
  const animatedValue = typeof value === 'number' ? useCountUp(value) : value;
  
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isDark 
        ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80' 
        : 'bg-white/90 border-cyan-100/50 shadow-sm hover:shadow-cyan-500/10'
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.75} />
          </div>
          {trend && trendValue && (
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0.5 border ${
                trend === 'up' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : trend === 'down'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : 
               trend === 'down' ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
              {trendValue}
            </Badge>
          )}
        </div>
        <p className={`text-3xl font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {animatedValue}
        </p>
        <p className={`text-xs mt-1 uppercase tracking-wide font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Mock Data for JUCO Features
// ═══════════════════════════════════════════════════════════════════════════
const MOCK_TRANSFER_CONNECTIONS = [
  { id: 'd1', collegeName: 'Georgia Tech', division: 'D1', playersTransferred: 2, status: 'active' },
  { id: 'd2', collegeName: 'NC State', division: 'D1', playersTransferred: 1, status: 'active' },
  { id: 'd3', collegeName: 'Wake Forest', division: 'D1', playersTransferred: 3, status: 'active' },
  { id: 'd4', collegeName: 'Appalachian State', division: 'D1', playersTransferred: 1, status: 'pending' },
];

const MOCK_TRANSFER_PORTAL_INTEREST = [
  { id: 'tp1', playerName: 'Marcus Williams', position: 'RHP', school: 'Coastal Carolina', division: 'D1', status: 'interested' },
  { id: 'tp2', playerName: 'Jake Thompson', position: 'SS', school: 'UNC Wilmington', division: 'D1', status: 'evaluating' },
  { id: 'tp3', playerName: 'Tyler Johnson', position: 'OF', school: 'East Carolina', division: 'D1', status: 'contacted' },
];

const MOCK_PRIORITY_NEEDS = [
  { id: 'pn1', position: 'RHP', priority: 'high', count: 2 },
  { id: 'pn2', position: 'MIF', priority: 'medium', count: 1 },
  { id: 'pn3', position: 'C', priority: 'high', count: 1 },
  { id: 'pn4', position: 'OF', priority: 'low', count: 2 },
];

// Academic progress mock data
const MOCK_ACADEMIC_PROGRESS = [
  { id: 'ap1', playerName: 'Marcus Williams', gpa: 3.4, creditsCompleted: 45, creditsRequired: 60, eligibilityStatus: 'eligible', graduationDate: 'May 2025' },
  { id: 'ap2', playerName: 'Jake Thompson', gpa: 2.8, creditsCompleted: 32, creditsRequired: 60, eligibilityStatus: 'eligible', graduationDate: 'May 2025' },
  { id: 'ap3', playerName: 'Tyler Johnson', gpa: 2.1, creditsCompleted: 28, creditsRequired: 60, eligibilityStatus: 'at_risk', graduationDate: 'Dec 2025' },
  { id: 'ap4', playerName: 'Chris Martinez', gpa: 3.8, creditsCompleted: 52, creditsRequired: 60, eligibilityStatus: 'eligible', graduationDate: 'May 2025' },
];

// 4-year college matching suggestions
const MOCK_COLLEGE_MATCHES = [
  { id: 'cm1', playerName: 'Marcus Williams', position: 'RHP', matches: [
    { collegeName: 'Georgia Tech', division: 'D1', matchScore: 95, interestLevel: 'high' },
    { collegeName: 'Clemson', division: 'D1', matchScore: 88, interestLevel: 'medium' },
    { collegeName: 'NC State', division: 'D1', matchScore: 82, interestLevel: 'high' },
  ]},
  { id: 'cm2', playerName: 'Jake Thompson', position: 'SS', matches: [
    { collegeName: 'Wake Forest', division: 'D1', matchScore: 91, interestLevel: 'high' },
    { collegeName: 'Duke', division: 'D1', matchScore: 85, interestLevel: 'medium' },
  ]},
  { id: 'cm3', playerName: 'Chris Martinez', position: 'C', matches: [
    { collegeName: 'Florida State', division: 'D1', matchScore: 93, interestLevel: 'high' },
    { collegeName: 'Miami', division: 'D1', matchScore: 89, interestLevel: 'medium' },
    { collegeName: 'Virginia Tech', division: 'D1', matchScore: 84, interestLevel: 'low' },
  ]},
];

// Transfer deadline timeline
const MOCK_TRANSFER_DEADLINES = [
  { id: 'td1', title: 'Fall Transfer Window Opens', date: '2024-08-01', daysUntil: -120, status: 'passed', description: 'Players can enter transfer portal' },
  { id: 'td2', title: 'Fall Academic Deadline', date: '2024-10-15', daysUntil: -45, status: 'passed', description: 'Credits must be submitted' },
  { id: 'td3', title: 'NLI Early Signing Period', date: '2024-11-13', daysUntil: 5, status: 'upcoming', description: 'Early signing period begins' },
  { id: 'td4', title: 'Winter Transfer Window', date: '2024-12-15', daysUntil: 37, status: 'upcoming', description: 'Winter portal window opens' },
  { id: 'td5', title: 'Spring Signing Period', date: '2025-04-15', daysUntil: 158, status: 'future', description: 'Regular signing period' },
  { id: 'td6', title: 'Spring Semester Deadline', date: '2025-05-01', daysUntil: 174, status: 'future', description: 'Final transcript deadline' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function JUCOCoachDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let coachData = null;
    
    if (isDevMode()) {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', DEV_ENTITY_IDS.coach)
        .single();
      coachData = data;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      coachData = data;
    }

    if (!coachData) {
      router.push('/onboarding/coach');
      return;
    }

    setCoach(coachData);

    const teamData = await getTeamForOwner(coachData.id);
    if (teamData) {
      setTeam(teamData);
      const [rosterData, scheduleData] = await Promise.all([
        getTeamRoster(teamData.id),
        getTeamSchedule(teamData.id),
      ]);
      setRoster(rosterData);
      setSchedule(scheduleData);
    }

    setLoading(false);
  };

  // Computed values
  const upcomingEvents = useMemo(() => 
    schedule
      .filter(e => new Date(e.start_time) >= new Date())
      .slice(0, 5),
    [schedule]
  );

  const profileCompletion = useMemo(() => {
    if (!coach) return 30;
    let score = 0;
    if (coach.full_name) score += 15;
    if (coach.school_name || coach.organization_name) score += 20;
    if (coach.school_city || coach.organization_city) score += 10;
    if (coach.school_state || coach.organization_state) score += 10;
    if (coach.about) score += 15;
    if (coach.logo_url) score += 15;
    if (coach.athletic_conference) score += 15;
    return Math.min(100, score) || 30;
  }, [coach]);

  // Program branding - cyan/teal for JUCO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coachData = coach as any;
  const programColor = coachData?.primary_color || '#06B6D4'; // Cyan for JUCO
  const programName = coach?.school_name || coach?.organization_name || 'Your JUCO Program';
  const programInitials = programName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const location = [coach?.school_city || coach?.organization_city, coach?.school_state || coach?.organization_state].filter(Boolean).join(', ');
  const conference = coach?.athletic_conference || 'Set Conference';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="w-8 h-8 bg-cyan-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 via-slate-50 to-cyan-50/20'}`}>
      {/* ═══════════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: isDark 
            ? `linear-gradient(160deg, #083344 0%, #0e4b61 40%, #0c4a5e 100%)`
            : `linear-gradient(160deg, #0e7490 0%, #0891b2 40%, #06b6d4 100%)`,
        }}
      >
        {/* Subtle radial glows */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 25% 30%, ${programColor}18, ${programColor}08 40%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 75% 60%, ${programColor}10, transparent 50%)
            `,
          }}
        />
        
        {/* Noise texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        {/* Ambient orbs */}
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-[0.2] pointer-events-none"
          style={{ background: programColor }}
        />
        <div 
          className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-[0.15] pointer-events-none"
          style={{ background: '#22d3ee' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Program Logo */}
            <div className="relative group">
              <div 
                className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"
                style={{ background: programColor }}
              />
              <Avatar className="relative h-20 w-20 md:h-24 md:w-24 ring-4 ring-white/20 shadow-2xl rounded-2xl">
                <AvatarImage src={coach?.logo_url ?? undefined} className="rounded-2xl object-cover" />
                <AvatarFallback 
                  className="rounded-2xl text-2xl md:text-3xl font-bold text-white"
                  style={{ background: programColor }}
                >
                  {programInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Program Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold text-white truncate">
                  {programName}
                </h1>
                <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm">
                  <Building2 className="w-3 h-3 mr-1" />
                  JUCO
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/70 text-sm mb-2">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {conference}
                </span>
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" style={{ color: programColor }} />
                    {location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {roster.length} Players
                </span>
              </div>

              {coach?.full_name && (
                <div className="text-white/60 text-sm mb-2">
                  <span className="font-medium text-white/80">{coach.full_name}</span>
                  {' — Head Coach'}
                </div>
              )}

              {/* Profile Completion */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60">Profile</span>
                    <span className="text-white/80 font-medium">{profileCompletion}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${profileCompletion}%`, 
                        background: `linear-gradient(90deg, ${programColor}, #22d3ee)` 
                      }}
                    />
                  </div>
                </div>
                {profileCompletion < 100 && (
                  <Link href="/coach/juco/program">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 h-7 text-xs">
                      Complete profile <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                onClick={() => router.push('/coach/juco/discover')}
              >
                <Search className="w-4 h-4" />
                Find Recruits
              </Button>
              <Link href="/coach/juco/program">
                <Button 
                  variant="ghost" 
                  className="w-full text-white/70 hover:text-white hover:bg-white/10 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Users} 
            value={roster.length} 
            label="Roster Size"
            iconBg={isDark ? 'bg-blue-500/10' : 'bg-blue-100'}
            iconColor={isDark ? 'text-blue-400' : 'text-blue-600'}
            isDark={isDark}
          />
          <StatCard 
            icon={ArrowRightLeft} 
            value={MOCK_TRANSFER_CONNECTIONS.reduce((sum, c) => sum + c.playersTransferred, 0)} 
            label="D1/D2 Transfers"
            trend="up"
            trendValue="+3"
            iconBg={isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}
            iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}
            isDark={isDark}
          />
          <StatCard 
            icon={Eye} 
            value={MOCK_TRANSFER_PORTAL_INTEREST.length} 
            label="Portal Targets"
            trend="neutral"
            trendValue="Active"
            iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
            iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
            isDark={isDark}
          />
          <StatCard 
            icon={Calendar} 
            value={upcomingEvents.length} 
            label="Upcoming Games"
            iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
            iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
            isDark={isDark}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Portal Search */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}`}>
                    <ArrowRightLeft className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Transfer Portal Targets
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Players you&apos;re tracking from the portal
                    </p>
                  </div>
                </div>
                <Link href="/coach/juco/transfer-portal">
                  <Button variant="ghost" size="sm" className={`gap-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                    Manage Portal <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_TRANSFER_PORTAL_INTEREST.map((player) => (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                          : 'bg-cyan-50/50 hover:bg-cyan-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white/10">
                          <AvatarFallback className={`text-sm font-medium ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-500 text-white'}`}>
                            {player.playerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {player.playerName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{player.position}</Badge>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {player.school} ({player.division})
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`capitalize ${
                        player.status === 'interested' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : player.status === 'evaluating'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {player.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/coach/juco/transfer-portal">
                  <Button variant="outline" className="w-full mt-4 gap-2">
                    <Search className="w-4 h-4" />
                    Manage Transfer Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Current Roster */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                    <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Current Roster
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {roster.length} players
                    </p>
                  </div>
                </div>
                <Link href="/coach/juco/team">
                  <Button variant="ghost" size="sm" className={`gap-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {roster.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No players on roster yet</p>
                    <Link href="/coach/juco/team">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Players
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roster.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                          isDark 
                            ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                        onClick={() => router.push(`/coach/player/${member.player.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-white/10">
                            <AvatarImage src={member.player.avatar_url || undefined} />
                            <AvatarFallback className={`text-sm font-medium ${isDark ? 'bg-slate-600 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                              {member.player.full_name?.slice(0, 2).toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {member.player.full_name || 'Player'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] ${isDark ? 'border-slate-600' : ''}`}>
                                {member.player.primary_position}
                              </Badge>
                              {member.player.high_school_state && (
                                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {member.player.high_school_state}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* D1/D2 Connections */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                    <GraduationCap className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      D1/D2 Connections
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Schools your players transfer to
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MOCK_TRANSFER_CONNECTIONS.map((connection) => (
                    <div 
                      key={connection.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {connection.collegeName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {connection.collegeName}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {connection.division}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {connection.playersTransferred} transfers
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Needs */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                    <Target className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Priority Needs
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Positions to fill
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_PRIORITY_NEEDS.map((need) => (
                    <div 
                      key={need.id}
                      className={`p-3 rounded-xl text-center ${
                        need.priority === 'high'
                          ? isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                          : need.priority === 'medium'
                          ? isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                          : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                      }`}
                    >
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {need.position}
                      </p>
                      <p className={`text-xs ${
                        need.priority === 'high' 
                          ? 'text-red-500' 
                          : need.priority === 'medium'
                          ? 'text-amber-600'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Need {need.count}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/coach/juco/team">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-xs">Roster</span>
                    </Button>
                  </Link>
                  <Link href="/coach/juco/messages">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <MessageSquare className="w-4 h-4 mr-2 text-cyan-500" />
                      <span className="text-xs">Messages</span>
                    </Button>
                  </Link>
                  <Link href="/coach/juco/team?tab=schedule">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="text-xs">Schedule</span>
                    </Button>
                  </Link>
                  <Link href="/coach/juco/program">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <Edit className="w-4 h-4 mr-2 text-emerald-500" />
                      <span className="text-xs">Edit Profile</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TRANSFER TIMELINE & ACADEMIC TRACKING
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transfer Deadline Timeline */}
          <Card className={`overflow-hidden ${
            isDark 
              ? 'bg-slate-800/60 border-slate-700/50' 
              : 'bg-white/90 border-slate-200/50 shadow-sm'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                    <CalendarDays className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Transfer Timeline
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Key deadlines & windows
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                
                <div className="space-y-4">
                  {MOCK_TRANSFER_DEADLINES.map((deadline, index) => (
                    <div key={deadline.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                        deadline.status === 'passed' 
                          ? 'bg-slate-400 border-slate-400' 
                          : deadline.status === 'upcoming'
                          ? 'bg-cyan-500 border-cyan-500 animate-pulse'
                          : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                      }`} />
                      
                      <div className={`p-3 rounded-xl ${
                        deadline.status === 'upcoming'
                          ? isDark ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'
                          : deadline.status === 'passed'
                          ? isDark ? 'bg-slate-700/20' : 'bg-slate-50'
                          : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-medium text-sm ${
                              deadline.status === 'passed'
                                ? isDark ? 'text-slate-500' : 'text-slate-400'
                                : isDark ? 'text-white' : 'text-slate-800'
                            }`}>
                              {deadline.title}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {deadline.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-medium ${
                              deadline.status === 'upcoming' 
                                ? 'text-cyan-500' 
                                : deadline.status === 'passed'
                                ? isDark ? 'text-slate-500' : 'text-slate-400'
                                : isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {new Date(deadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            {deadline.status === 'upcoming' && deadline.daysUntil > 0 && (
                              <Badge className="mt-1 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">
                                <Timer className="w-3 h-3 mr-1" />
                                {deadline.daysUntil}d
                              </Badge>
                            )}
                            {deadline.status === 'passed' && (
                              <Badge variant="outline" className="mt-1 text-[10px] opacity-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Progress Tracking */}
          <Card className={`overflow-hidden ${
            isDark 
              ? 'bg-slate-800/60 border-slate-700/50' 
              : 'bg-white/90 border-slate-200/50 shadow-sm'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                    <BookOpen className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Academic Progress
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Player eligibility & credits
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className={`gap-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_ACADEMIC_PROGRESS.map((player) => {
                  const progressPercent = Math.round((player.creditsCompleted / player.creditsRequired) * 100);
                  return (
                    <div 
                      key={player.id}
                      className={`p-3 rounded-xl ${
                        player.eligibilityStatus === 'at_risk'
                          ? isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                          : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {player.playerName}
                          </p>
                          {player.eligibilityStatus === 'at_risk' && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              At Risk
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              GPA: {player.gpa.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Credits: {player.creditsCompleted}/{player.creditsRequired}
                          </span>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            {player.graduationDate}
                          </span>
                        </div>
                        <GlassProgressBar 
                          value={progressPercent} 
                          variant={isDark ? 'glass' : 'default'}
                          size="sm"
                          ratingLevel={progressPercent >= 80 ? 'excellent' : progressPercent >= 50 ? 'good' : 'developing'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            4-YEAR COLLEGE MATCHING
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className={`overflow-hidden ${
          isDark 
            ? 'bg-slate-800/60 border-slate-700/50' 
            : 'bg-white/90 border-slate-200/50 shadow-sm'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                  <School className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    4-Year College Matching
                  </CardTitle>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    AI-powered suggestions based on player profiles & academics
                  </p>
                </div>
              </div>
              <Badge className={`${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <Sparkles className="w-3 h-3 mr-1" />
                New Matches
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {MOCK_COLLEGE_MATCHES.map((player) => (
                <div 
                  key={player.id}
                  className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs font-medium ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                        {player.playerName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {player.playerName}
                      </p>
                      <Badge variant="outline" className="text-[10px]">{player.position}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {player.matches.map((match, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          isDark ? 'bg-slate-700/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                            match.matchScore >= 90
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : match.matchScore >= 80
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {match.matchScore}
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {match.collegeName}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {match.division}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] ${
                          match.interestLevel === 'high'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : match.interestLevel === 'medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {match.interestLevel === 'high' && <Star className="w-3 h-3 mr-1" />}
                          {match.interestLevel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="ghost" size="sm" className={`w-full mt-3 text-xs ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>
                    View all matches <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20' : 'bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                    <Zap className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Get More Matches
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Complete player profiles for better 4-year college recommendations
                    </p>
                  </div>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2">
                  <FileText className="w-4 h-4" />
                  Update Profiles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
