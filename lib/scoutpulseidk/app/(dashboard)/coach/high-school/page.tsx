'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Star,
  GraduationCap,
  Eye,
  TrendingUp,
  TrendingDown,
  Building2,
  ExternalLink,
  CheckCircle2,
  UserPlus,
  Mail,
  BarChart3,
  Target,
  Activity,
  Zap,
  FileText,
  Settings,
  Bell,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';
import type { Coach } from '@/lib/types';
import { getTeamForOwner, getTeamRoster, getTeamSchedule, type Team, type TeamMember, type ScheduleEvent } from '@/lib/queries/team';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { toast } from 'sonner';
import { GlassProgressBar, SkillRatingBar } from '@/components/ui/GlassProgressBar';

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
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconBg: string;
  iconColor: string;
  isDark: boolean;
}) {
  const animatedValue = useCountUp(value);
  
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isDark 
        ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80' 
        : 'bg-white/90 border-emerald-100/50 shadow-sm hover:shadow-emerald-500/10'
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
// College Interest Mock Data
// ═══════════════════════════════════════════════════════════════════════════
const MOCK_COLLEGE_INTEREST = [
  { id: 'ci1', playerId: 'p1', playerName: 'Marcus Johnson', position: 'SS', gradYear: 2025, schools: ['Georgia Tech', 'Clemson', 'Florida State'], views: 23 },
  { id: 'ci2', playerId: 'p2', playerName: 'Jake Williams', position: 'RHP', gradYear: 2025, schools: ['Wake Forest', 'Duke'], views: 18 },
  { id: 'ci3', playerId: 'p3', playerName: 'Tyler Smith', position: 'C', gradYear: 2026, schools: ['NC State'], views: 12 },
];

const MOCK_RECENT_ACTIVITY = [
  { id: 'a1', type: 'view', playerName: 'Marcus Johnson', collegeName: 'Georgia Tech', time: '2h ago' },
  { id: 'a2', type: 'interest', playerName: 'Jake Williams', collegeName: 'Wake Forest', time: '4h ago' },
  { id: 'a3', type: 'message', playerName: 'Tyler Smith', collegeName: 'NC State', time: '1d ago' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function HSCoachDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all');

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
      
      if (!coachData) {
        router.push('/onboarding/coach');
        return;
      }
    }

    if (!coachData) {
      setLoading(false);
      return;
    }

    setCoach(coachData);

    // Load team data
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

  const seniors = useMemo(() => roster.filter(m => m.player.grad_year === 2025), [roster]);
  const juniors = useMemo(() => roster.filter(m => m.player.grad_year === 2026), [roster]);

  const profileCompletion = useMemo(() => {
    if (!coach) return 30;
    let score = 0;
    if (coach.full_name) score += 20;
    if (coach.school_name) score += 20;
    if (coach.school_city) score += 15;
    if (coach.school_state) score += 15;
    if (coach.about) score += 15;
    if (coach.logo_url) score += 15;
    return Math.min(100, score) || 30;
  }, [coach]);

  // Program branding
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coachData = coach as any;
  const programColor = coachData?.primary_color || '#F59E0B'; // Amber for HS
  const schoolName = coach?.school_name || 'Your High School';
  const schoolInitials = schoolName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const location = [coach?.school_city, coach?.school_state].filter(Boolean).join(', ');

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 via-slate-50 to-amber-50/20'}`}>
      {/* ═══════════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: isDark 
            ? `linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f0f1a 100%)`
            : `linear-gradient(160deg, #451a03 0%, #78350f 40%, #92400e 100%)`,
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
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-[0.15] pointer-events-none"
          style={{ background: programColor }}
        />
        <div 
          className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-[0.1] pointer-events-none"
          style={{ background: programColor }}
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* School Logo */}
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
                  {schoolInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* School Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold text-white truncate">
                  {schoolName}
                </h1>
                <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm">
                  <Building2 className="w-3 h-3 mr-1" />
                  High School
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/70 text-sm mb-2">
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
                        background: `linear-gradient(90deg, ${programColor}, ${programColor}cc)` 
                      }}
                    />
                  </div>
                </div>
                {profileCompletion < 100 && (
                  <Link href="/coach/high-school/program">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 h-7 text-xs">
                      Complete profile <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href="/coach/high-school/program">
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
                onClick={() => toast.info('Public profile coming soon')}
              >
                <ExternalLink className="w-4 h-4" />
                View Public
              </Button>
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
            icon={GraduationCap} 
            value={seniors.length} 
            label="Seniors (2025)"
            trend="neutral"
            trendValue="Active"
            iconBg={isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
            iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
            isDark={isDark}
          />
          <StatCard 
            icon={Star} 
            value={juniors.length} 
            label="Juniors (2026)"
            iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
            iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
            isDark={isDark}
          />
          <StatCard 
            icon={Eye} 
            value={MOCK_COLLEGE_INTEREST.reduce((sum, ci) => sum + ci.views, 0)} 
            label="College Views"
            trend="up"
            trendValue="+12%"
            iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
            iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
            isDark={isDark}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Roster & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Roster */}
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
                      Team Roster
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {roster.length} players
                    </p>
                  </div>
                </div>
                <Link href="/coach/high-school/team">
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
                    <Link href="/coach/high-school/team">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Players
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roster.slice(0, 6).map((member) => (
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
                            <AvatarFallback className={`text-sm font-medium ${isDark ? 'bg-slate-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                              {member.player.full_name?.slice(0, 2).toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {member.player.full_name || 'Player'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] px-1.5 ${isDark ? 'border-slate-600' : ''}`}>
                                {member.player.primary_position}
                              </Badge>
                              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Class of {member.player.grad_year}
                              </span>
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

            {/* Upcoming Schedule */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Upcoming Schedule
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {upcomingEvents.length} events
                    </p>
                  </div>
                </div>
                <Link href="/coach/high-school/team?tab=schedule">
                  <Button variant="ghost" size="sm" className={`gap-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming events</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="w-4 h-4" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {event.event_name || event.opponent_name || 'Event'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Clock className="w-3 h-3" />
                                {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              {event.location_name && (
                                <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <MapPin className="w-3 h-3" />
                                  {event.location_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`capitalize text-[10px] ${
                              event.event_type === 'game' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                : 'bg-blue-500/10 text-blue-600 border-blue-200'
                            }`}
                          >
                            {event.event_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - College Interest & Activity */}
          <div className="space-y-6">
            {/* College Interest in Your Players */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                      <GraduationCap className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        College Interest
                      </CardTitle>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Players getting noticed
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_COLLEGE_INTEREST.map((interest) => (
                    <div 
                      key={interest.id}
                      className={`p-3 rounded-xl transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {interest.playerName}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {interest.position} • {interest.gradYear}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {interest.views}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {interest.schools.map((school) => (
                          <Badge 
                            key={school} 
                            variant="outline" 
                            className={`text-[10px] ${isDark ? 'border-slate-600 text-slate-300' : ''}`}
                          >
                            {school}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                      <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        Recent Activity
                      </CardTitle>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        College coach interactions
                      </p>
                    </div>
                  </div>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className={`w-24 h-7 text-xs ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="interest">Interest</SelectItem>
                      <SelectItem value="messages">Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MOCK_RECENT_ACTIVITY.map((activity) => (
                    <div 
                      key={activity.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-full ${
                        activity.type === 'view' 
                          ? 'bg-blue-500/10' 
                          : activity.type === 'interest'
                          ? 'bg-emerald-500/10'
                          : 'bg-purple-500/10'
                      }`}>
                        {activity.type === 'view' && <Eye className="w-3 h-3 text-blue-500" />}
                        {activity.type === 'interest' && <Star className="w-3 h-3 text-emerald-500" />}
                        {activity.type === 'message' && <Mail className="w-3 h-3 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          <span className="font-medium">{activity.collegeName}</span>
                          {activity.type === 'view' && ' viewed '}
                          {activity.type === 'interest' && ' showed interest in '}
                          {activity.type === 'message' && ' messaged '}
                          <span className="font-medium">{activity.playerName}</span>
                        </p>
                      </div>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Metrics */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/90 border-slate-200/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                    <BarChart3 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Team Performance
                    </CardTitle>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Current season stats
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SkillRatingBar 
                  name="Batting Average" 
                  rating={72} 
                  previousRating={68}
                  variant={isDark ? 'glass' : 'default'}
                  size="sm"
                />
                <SkillRatingBar 
                  name="On-Base %" 
                  rating={65} 
                  previousRating={62}
                  variant={isDark ? 'glass' : 'default'}
                  size="sm"
                />
                <SkillRatingBar 
                  name="Pitching ERA" 
                  rating={78} 
                  previousRating={75}
                  variant={isDark ? 'glass' : 'default'}
                  size="sm"
                />
                <SkillRatingBar 
                  name="Fielding %" 
                  rating={85} 
                  previousRating={82}
                  variant={isDark ? 'glass' : 'default'}
                  size="sm"
                />
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
                  <Link href="/coach/high-school/team">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <UserPlus className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-xs">Add Player</span>
                    </Button>
                  </Link>
                  <Link href="/coach/high-school/messages">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <MessageSquare className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-xs">Messages</span>
                    </Button>
                  </Link>
                  <Link href="/coach/high-school/team?tab=schedule">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="text-xs">Schedule</span>
                    </Button>
                  </Link>
                  <Link href="/coach/high-school/program">
                    <Button variant="outline" className={`w-full justify-start h-auto py-3 ${isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : ''}`}>
                      <Edit className="w-4 h-4 mr-2 text-emerald-500" />
                      <span className="text-xs">Edit Profile</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Tools */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700/50' 
                : 'bg-gradient-to-br from-amber-50 to-white border-amber-100/50 shadow-sm'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Management Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/coach/high-school/roster" className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${
                    isDark 
                      ? 'bg-slate-700/40 hover:bg-slate-700/60' 
                      : 'bg-white hover:shadow-md'
                  }`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                      <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Roster Management</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage players & college interest</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </Link>
                <Link href="/coach/high-school/messages" className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${
                    isDark 
                      ? 'bg-slate-700/40 hover:bg-slate-700/60' 
                      : 'bg-white hover:shadow-md'
                  }`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                      <MessageSquare className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Communication Hub</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Messages & announcements</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </Link>
                <Link href="/coach/high-school/team?tab=stats" className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${
                    isDark 
                      ? 'bg-slate-700/40 hover:bg-slate-700/60' 
                      : 'bg-white hover:shadow-md'
                  }`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <BarChart3 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Stats & Analytics</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Player performance data</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </Link>
                <Link href="/coach/high-school/program" className="block">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${
                    isDark 
                      ? 'bg-slate-700/40 hover:bg-slate-700/60' 
                      : 'bg-white hover:shadow-md'
                  }`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <Settings className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Program Settings</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>School profile & branding</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
