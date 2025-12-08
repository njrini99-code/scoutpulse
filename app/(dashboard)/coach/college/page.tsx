'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { pageTransition, staggerContainer, staggerItem } from '@/lib/animations';
import { logError } from '@/lib/utils/errorLogger';
import { Card } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Users,
  Star,
  Edit,
  ExternalLink,
  Calendar,
  MapPin,
  UserPlus,
  Heart,
  Send,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Mail,
  UserCheck,
  Sparkles,
  Bookmark,
  AlertTriangle,
  Handshake,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import type { Coach } from '@/lib/types';
import { CoachDashboardSkeleton } from '@/components/ui/loading-state';
import { getCoachCamps } from '@/lib/queries/camp-registration';

interface PipelineStats {
  watchlist: number;
  highPriority: number;
  offersExtended: number;
  committed: number;
}

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
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
interface DashboardStats {
  profileViews: number;
  newFollowers: number;
  top5Mentions: number;
}

interface Activity {
  id: string;
  playerId: string;
  type: 'follow' | 'top5' | 'view' | 'camp';
  user: {
    name: string;
    avatar: string | null;
    position: string;
    gradYear: number;
    state: string;
  };
  action: string;
  time: string;
}

interface Camp {
  id: string;
  title: string;
  date: string;
  location: string;
  attending: number;
  capacity: number;
  interested: number;
  status: 'open' | 'limited' | 'full';
  image: string | null;
}

export default function CollegeCoachDashboard() {
  const router = useRouter();
  const [activityFilter, setActivityFilter] = useState('all');
  const [coach, setCoach] = useState<Coach | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStats>({ watchlist: 0, highPriority: 0, offersExtended: 0, committed: 0 });
  const [stats, setStats] = useState<DashboardStats>({ profileViews: 0, newFollowers: 0, top5Mentions: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [pipelineAvatars, setPipelineAvatars] = useState<Record<string, string[]>>({
    watchlist: [],
    highPriority: [],
    offersOut: [],
    committed: [],
  });
  const [loading, setLoading] = useState(true);
  const [watchlistStates, setWatchlistStates] = useState<Record<string, boolean>>({});

  // Helper functions
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function formatCampDate(date: string | Date | null): string {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      let coachData = null;
      let coachId: string | null = null;

      if (isDevMode()) {
        coachId = DEV_ENTITY_IDS.coach;
        const { data, error } = await supabase.from('coaches').select('*').eq('id', coachId).single();
        if (error) {
          logError(error, { component: 'CollegeCoachDashboard', action: 'loadCoachData' });
          toast.error('Failed to load coach data');
          setLoading(false);
          return;
        }
        coachData = data;
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }
        const { data, error } = await supabase.from('coaches').select('*').eq('user_id', user.id).single();
        if (error) {
          logError(error, { component: 'CollegeCoachDashboard', action: 'loadCoachData' });
          toast.error('Failed to load coach data');
          setLoading(false);
          return;
        }
        coachData = data;
        coachId = data?.id || null;
      }

      if (coachData) setCoach(coachData);

      if (coachId) {
        try {
          // Load pipeline stats from recruit_watchlist
          const { data: watchlistData, error: watchlistError } = await supabase
            .from('recruit_watchlist')
            .select('status, players!inner(avatar_url)')
            .eq('coach_id', coachId);
          
          if (!watchlistError && watchlistData) {
            const pipelineCounts: PipelineStats = {
              watchlist: watchlistData.filter(r => r.status === 'watchlist').length,
              highPriority: watchlistData.filter(r => r.status === 'high_priority').length,
              offersExtended: watchlistData.filter(r => r.status === 'offer_extended').length,
              committed: watchlistData.filter(r => r.status === 'committed').length,
            };
            setPipeline(pipelineCounts);

            // Get avatars for each status
            const avatars: Record<string, string[]> = {
              watchlist: watchlistData
                .filter(r => r.status === 'watchlist' && (r.players as any)?.avatar_url)
                .slice(0, 5)
                .map(r => (r.players as any).avatar_url),
              highPriority: watchlistData
                .filter(r => r.status === 'high_priority' && (r.players as any)?.avatar_url)
                .slice(0, 5)
                .map(r => (r.players as any).avatar_url),
              offersOut: watchlistData
                .filter(r => r.status === 'offer_extended' && (r.players as any)?.avatar_url)
                .slice(0, 5)
                .map(r => (r.players as any).avatar_url),
              committed: watchlistData
                .filter(r => r.status === 'committed' && (r.players as any)?.avatar_url)
                .slice(0, 5)
                .map(r => (r.players as any).avatar_url),
            };
            setPipelineAvatars(avatars);
          }

          // Load stats: profile views (count unique players who viewed coach's profile)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { count: profileViewsCount } = await supabase
            .from('player_engagement_events')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', coachId)
            .eq('engagement_type', 'profile_view')
            .gte('engagement_date', thirtyDaysAgo.toISOString());

          // Load new followers (players who added coach to watchlist in last 30 days)
          const { count: newFollowersCount } = await supabase
            .from('recruit_watchlist')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', coachId)
            .gte('created_at', thirtyDaysAgo.toISOString());

          // Load top 5 mentions (players who added coach to their top 5)
          const { count: top5Count } = await supabase
            .from('recruiting_interests')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', coachId)
            .gte('created_at', thirtyDaysAgo.toISOString());

          setStats({
            profileViews: profileViewsCount || 0,
            newFollowers: newFollowersCount || 0,
            top5Mentions: top5Count || 0,
          });

          // Load recent activities
          const { data: recentEvents } = await supabase
            .from('player_engagement_events')
            .select(`
              id,
              player_id,
              engagement_type,
              engagement_date,
              players!inner(
                id,
                first_name,
                last_name,
                full_name,
                avatar_url,
                primary_position,
                grad_year,
                high_school_state
              )
            `)
            .eq('coach_id', coachId)
            .order('engagement_date', { ascending: false })
            .limit(20);

          if (recentEvents) {
            const formattedActivities: Activity[] = recentEvents
              .filter(e => (e.players as any))
              .map((e, idx) => {
                const player = e.players as any;
                const timeAgo = getTimeAgo(new Date(e.engagement_date));
                let action = '';
                let type: Activity['type'] = 'view';

                if (e.engagement_type === 'profile_view') {
                  action = 'viewed your profile';
                  type = 'view';
                } else if (e.engagement_type === 'watchlist_add') {
                  action = 'added you to their watchlist';
                  type = 'follow';
                }

                return {
                  id: e.id || `activity-${idx}`,
                  playerId: e.player_id,
                  type,
                  user: {
                    name: player.full_name || `${player.first_name} ${player.last_name}`,
                    avatar: player.avatar_url,
                    position: player.primary_position || 'UTIL',
                    gradYear: player.grad_year || 2026,
                    state: player.high_school_state || 'N/A',
                  },
                  action,
                  time: timeAgo,
                };
              });
            setActivities(formattedActivities);
          }

          // Load camps
          const coachCamps = await getCoachCamps(coachId);
          const formattedCamps: Camp[] = coachCamps.map(camp => ({
            id: camp.id,
            title: camp.name || 'Camp',
            date: formatCampDate(camp.start_date),
            location: camp.location || 'TBD',
            attending: camp.registration_count || 0,
            capacity: camp.capacity || 0,
            interested: camp.interested_count || 0,
            status: (camp.registration_count || 0) >= (camp.capacity || 0) ? 'full' : 
                    (camp.registration_count || 0) >= (camp.capacity || 0) * 0.8 ? 'limited' : 'open',
            image: null, // CampEvent doesn't have image_url, can be added later
          }));
          setCamps(formattedCamps);

        } catch (error) {
          logError(error, { component: 'CollegeCoachDashboard', action: 'processRecruitsData' });
          // Don't block the page if data loading fails
        }
      }
      setLoading(false);
    } catch (error) {
      logError(error, { component: 'CollegeCoachDashboard', action: 'loadCoachData', metadata: { unexpected: true } });
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (activityFilter === 'all') return true;
      if (activityFilter === 'followers') return a.type === 'follow';
      if (activityFilter === 'top5') return a.type === 'top5';
      if (activityFilter === 'views') return a.type === 'view';
      if (activityFilter === 'camps') return a.type === 'camp';
      return true;
    });
  }, [activities, activityFilter]);

  const profileCompletion = useMemo(() => {
    if (!coach) return 40;
    let score = 0;
    if (coach.full_name) score += 15;
    if (coach.school_name) score += 15;
    if (coach.program_division) score += 10;
    if (coach.athletic_conference) score += 10;
    if (coach.about) score += 15;
    if (coach.program_values) score += 10;
    if (coach.what_we_look_for) score += 10;
    if (coach.logo_url) score += 10;
    if (coach.email_contact) score += 5;
    return Math.min(100, score) || 40;
  }, [coach]);

  const handleViewPlayer = (playerId: string) => router.push(`/coach/player/${playerId}`);
  
  const toggleWatchlist = (playerId: string, playerName: string) => {
    const isAdding = !watchlistStates[playerId];
    setWatchlistStates(prev => ({ ...prev, [playerId]: isAdding }));
    toast.success(isAdding ? `${playerName} added to watchlist` : `${playerName} removed from watchlist`);
  };

  const handlePipelineClick = (status: string) => router.push(`/coach/college/recruiting-planner?status=${status}`);
  const handleCampClick = (campId: string) => router.push(`/coach/college/camps?camp=${campId}`);

  // Dynamic program colors (fallback to brand green)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coachData = coach as any;
  const programColor = coachData?.primary_color || '#00C46F';
  const programColorDark = coachData?.secondary_color || '#003D2B';

  if (loading) {
    return <CoachDashboardSkeleton />;
  }

  const programName = coach?.school_name || coach?.program_name || 'Maine University';
  const programInitials = programName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const philosophy = coach?.program_philosophy || coach?.about?.slice(0, 100) || 'Building champions on and off the field';

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HERO BANNER - Program-Themed with Refined Ambient Glow
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #0A3B2E 0%, #062A20 40%, #041A14 100%)`,
        }}
      >
        {/* Subtle multi-stop radial glow - ambient shine */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 25% 30%, ${programColor}18, ${programColor}08 40%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 75% 60%, ${programColor}10, transparent 50%)
            `,
          }}
        />
        
        {/* Micro-noise texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        
        {/* Vignette effect around edges */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
          }}
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        {/* Soft ambient orbs - very subtle */}
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-[0.12] pointer-events-none"
          style={{ background: programColor }}
        />
        <div 
          className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-[0.08] pointer-events-none"
          style={{ background: programColor }}
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Floating Logo Badge with Glow */}
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

            {/* Program Info Card */}
            <div className="flex-1 min-w-0">
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 md:p-5 border border-white/10">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {programName}
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  {coach?.program_division || 'D1'} · {coach?.athletic_conference || 'Set Conference'}
                </p>
                <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3" />
                  {coach?.full_name || 'Nicholas Rini'} — {coach?.coach_title || 'Head Coach'}
                </p>
                
                {/* Philosophy tagline */}
                <p className="text-white/40 text-xs italic mt-3 line-clamp-1">
                  "{philosophy}"
                </p>

                {/* Profile Completion */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-white/50 uppercase tracking-wide">Profile</span>
                      <span className="font-semibold" style={{ color: programColor }}>{profileCompletion}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${profileCompletion}%`, background: programColor }}
                      />
                    </div>
                  </div>
                  <Link href="/coach/college/program">
                    <span className="text-[10px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-0.5">
                      Complete profile
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <Link href="/coach/college/program" className="flex-1 md:flex-none">
                <Button 
                  className="w-full h-10 gap-2 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
                  style={{ background: programColor }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-10 gap-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm text-sm"
                onClick={() => window.open('/program/preview', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View Public</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          METRIC CARDS - Animated Count-Up with Hover Effects
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 -mt-5 relative z-10">
        <motion.div 
          className="grid grid-cols-3 gap-3 md:gap-4"
          variants={staggerContainer as any}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<Eye className="w-5 h-5" strokeWidth={1.75} />}
              value={stats.profileViews}
              label="Profile Views"
              trend={12}
              trendDirection="up"
              accentColor="#0EA5E9"
              onClick={() => setActivityFilter('views')}
            />
          </motion.div>
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<UserPlus className="w-5 h-5" strokeWidth={1.75} />}
              value={stats.newFollowers}
              label="New Followers"
              trend={8}
              trendDirection="up"
              accentColor="#22C55E"
              onClick={() => setActivityFilter('followers')}
            />
          </motion.div>
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<Heart className="w-5 h-5" strokeWidth={1.75} />}
              value={stats.top5Mentions}
              label="Top 5 Mentions"
              trend={15}
              trendDirection="up"
              accentColor="#EC4899"
              onClick={() => setActivityFilter('top5')}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          
          {/* LEFT COLUMN - Activity Feed */}
          <div className="space-y-5">
            {/* Activity & Followers Feed */}
            <Card glass className="rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Activity Feed
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </h2>
                  <p className="text-xs text-muted-foreground">Recent interactions with your program</p>
                </div>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All activity</SelectItem>
                    <SelectItem value="followers">Follows</SelectItem>
                    <SelectItem value="top5">Top 5 mentions</SelectItem>
                    <SelectItem value="views">Profile views</SelectItem>
                    <SelectItem value="camps">Camp interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="divide-y divide-border/30">
                {filteredActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    isWatchlisted={watchlistStates[activity.playerId]}
                    onView={() => handleViewPlayer(activity.playerId)}
                    onToggleWatchlist={() => toggleWatchlist(activity.playerId, activity.user.name)}
                  />
                ))}
              </div>

              <div className="px-5 py-3 bg-muted/30 border-t border-border/30">
                <Link href="/coach/college/messages">
                  <button className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 group">
                    View all messages & interactions
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - Pipeline + Camps */}
          <div className="space-y-5">
            {/* Recruiting Pipeline */}
            <Card glass className="rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Recruiting Pipeline</h2>
                  <p className="text-xs text-muted-foreground">Your class at a glance</p>
                </div>
                <Link href="/coach/college/recruiting-planner">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80 gap-1">
                    Planner
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PipelineCard
                  icon={<Bookmark className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                  label="Watchlist"
                  count={pipeline.watchlist}
                  avatars={pipelineAvatars.watchlist}
                  accentColor="#0EA5E9"
                  onClick={() => handlePipelineClick('watchlist')}
                />
                <PipelineCard
                  icon={<AlertTriangle className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                  label="High Priority"
                  count={pipeline.highPriority}
                  avatars={pipelineAvatars.highPriority}
                  accentColor="#F59E0B"
                  onClick={() => handlePipelineClick('high_priority')}
                />
                <PipelineCard
                  icon={<Send className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                  label="Offers Out"
                  count={pipeline.offersExtended}
                  avatars={pipelineAvatars.offersOut}
                  accentColor="#8B5CF6"
                  onClick={() => handlePipelineClick('offer_extended')}
                />
                <PipelineCard
                  icon={<Handshake className="w-[18px] h-[18px]" strokeWidth={1.75} />}
                  label="Committed"
                  count={pipeline.committed}
                  avatars={pipelineAvatars.committed}
                  accentColor="#22C55E"
                  onClick={() => handlePipelineClick('committed')}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/30">
                <Link href="/coach/college/discover">
                  <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5 border-border/50 hover:bg-muted/50">
                    <Users className="w-4 h-4" />
                    Find Recruits
                  </Button>
                </Link>
                <Link href="/coach/college/watchlist">
                  <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5 border-border/50 hover:bg-muted/50">
                    <Star className="w-4 h-4" />
                    Watchlist
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Upcoming Camps - Horizontal Scroll */}
            <Card glass className="rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Upcoming Camps</h2>
                  <p className="text-xs text-muted-foreground">Events you're hosting</p>
                </div>
                <Link href="/coach/college/camps">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80 gap-1">
                    All camps
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Horizontal Scrollable Camps */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {camps.map((camp) => (
                  <CampCard
                    key={camp.id}
                    camp={camp}
                    programColor={programColor}
                    onClick={() => handleCampClick(camp.id)}
                  />
                ))}
              </div>

              <Link href="/coach/college/camps?action=create" className="block mt-4">
                <Button 
                  className="w-full h-9 gap-2 text-white text-xs font-medium shadow-lg hover:shadow-xl transition-all"
                  style={{ background: programColor }}
                >
                  <Plus className="w-4 h-4" />
                  Create New Camp
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Custom CSS for scrollbar hiding */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend: number;
  trendDirection: 'up' | 'down';
  accentColor: string;
  onClick?: () => void;
}

function MetricCard({ icon, value, label, trend, trendDirection, accentColor, onClick }: MetricCardProps) {
  const animatedValue = useCountUp(value);
  const isPositive = trendDirection === 'up';

  return (
    <button
      onClick={onClick}
      className="group relative backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl shadow-xl shadow-black/20 p-4 md:p-5 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/25 overflow-hidden"
    >
      {/* Accent glow on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${accentColor}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div 
          className="p-2.5 rounded-xl bg-white/60 dark:bg-white/10 shadow-sm backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ color: accentColor }}
        >
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />}
          {trend}%
        </div>
      </div>
      
      <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">{animatedValue.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">{label}</p>
    </button>
  );
}

interface ActivityRowProps {
  activity: Activity;
  isWatchlisted?: boolean;
  onView: () => void;
  onToggleWatchlist: () => void;
}

function ActivityRow({ activity, isWatchlisted, onView, onToggleWatchlist }: ActivityRowProps) {
  return (
    <div 
      className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onView}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-border/50">
        <AvatarImage src={activity.user.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {activity.user.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-tight">
          <span className="font-semibold">{activity.user.name}</span>
          <span className="text-muted-foreground"> {activity.action}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span>{activity.user.position}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>Class of {activity.user.gradYear}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>{activity.user.state}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>{activity.time}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={onView}
        >
          View
          <ArrowUpRight className="w-3 h-3" />
        </Button>
        {(activity.type === 'follow' || activity.type === 'top5') && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${isWatchlisted ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
            onClick={onToggleWatchlist}
          >
            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );
}

interface PipelineCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  avatars: string[];
  accentColor: string;
  onClick?: () => void;
}

function PipelineCard({ icon, label, count, avatars, accentColor, onClick }: PipelineCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 p-4 text-left transition-all duration-200 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <div 
          className="p-1.5 rounded-lg bg-white/60 dark:bg-white/10 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ color: accentColor }}
        >
          {icon}
        </div>
      </div>

      {/* Count */}
      <p className="text-2xl font-bold text-foreground tracking-tight">{count}</p>

      {/* Avatar Stack */}
      {avatars.length > 0 && (
        <div className="flex -space-x-2 mt-3">
          {avatars.slice(0, 4).map((avatar, i) => (
            <Avatar key={i} className="h-6 w-6 ring-2 ring-card">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-[10px] bg-muted">
                {String.fromCharCode(65 + i)}
              </AvatarFallback>
            </Avatar>
          ))}
          {avatars.length > 4 && (
            <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-[10px] text-muted-foreground font-medium">
              +{avatars.length - 4}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

interface CampCardProps {
  camp: Camp;
  programColor: string;
  onClick?: () => void;
}

function CampCard({ camp, programColor, onClick }: CampCardProps) {
  const statusConfig = {
    open: { label: 'Open', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    limited: { label: 'Limited', bg: 'bg-amber-500/10', text: 'text-amber-600' },
    full: { label: 'Sold Out', bg: 'bg-red-500/10', text: 'text-red-600' },
  };
  const status = statusConfig[camp.status as keyof typeof statusConfig];
  const fillPercent = Math.round((camp.attending / camp.capacity) * 100);

  return (
    <div 
      className="flex-shrink-0 w-[260px] snap-start rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden hover:border-border hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Mini Banner */}
      <div 
        className="h-16 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${programColor}40, ${programColor}10)` }}
      >
        <Calendar className="absolute right-3 top-3 w-8 h-8 text-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <Badge className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 ${status.bg} ${status.text} border-0`}>
          {status.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {camp.title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {camp.date}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {camp.location.split(',')[0]}
          </span>
        </div>

        {/* Capacity Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium text-foreground">{camp.attending}/{camp.capacity}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${fillPercent}%`, 
                background: fillPercent > 90 ? '#F59E0B' : programColor 
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: programColor }}>{camp.attending}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Attending</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground">{camp.interested}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Interested</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem className="text-xs">
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit Camp
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                <Users className="w-3.5 h-3.5 mr-2" />
                Attendees
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                <Mail className="w-3.5 h-3.5 mr-2" />
                Message Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
