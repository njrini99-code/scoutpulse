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
  Users,
  Calendar,
  MessageSquare,
  GraduationCap,
  Edit,
  ExternalLink,
  ChevronRight,
  MapPin,
  Clock,
  Building2,
  Plus,
  ArrowUpRight,
  Mail,
  Eye,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import type { Coach } from '@/lib/types';
import { getTeamForOwner, getTeamRoster, getTeamSchedule, type Team, type TeamMember, type ScheduleEvent } from '@/lib/queries/team';
import { getConversationsForCoach } from '@/lib/api/messaging/getConversationsForCoach';
import { CoachDashboardSkeleton } from '@/components/ui/loading-state';

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
interface Conversation {
  conversationId: string;
  title: string;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
}

export default function HsCoachOverviewPage() {
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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
          logError(error, { component: 'HsCoachOverviewPage', action: 'loadCoachData' });
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
          logError(error, { component: 'HsCoachOverviewPage', action: 'loadCoachData' });
          toast.error('Failed to load coach data');
          setLoading(false);
          return;
        }
        coachData = data;
        coachId = data?.id || null;
      }

      if (coachData) setCoach(coachData);

      if (coachId) {
        // Load team data
        const teamData = await getTeamForOwner(coachId);
        if (teamData) {
          setTeam(teamData);
          const [rosterData, scheduleData] = await Promise.all([
            getTeamRoster(teamData.id),
            getTeamSchedule(teamData.id),
          ]);
          setRoster(rosterData);
          setSchedule(scheduleData);
        }

        // Load recent conversations
        try {
          const convs = await getConversationsForCoach(coachId);
          setConversations(convs.slice(0, 5)); // Show top 5
        } catch (error) {
          logError(error, { component: 'HsCoachOverviewPage', action: 'loadConversations' });
          // Don't block the page if conversations fail to load
        }
      }
      setLoading(false);
    } catch (error) {
      logError(error, { component: 'HsCoachOverviewPage', action: 'loadData', metadata: { unexpected: true } });
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Computed values
  const upcomingEvents = useMemo(() => 
    schedule
      .filter(e => new Date(e.start_time) >= new Date())
      .slice(0, 5),
    [schedule]
  );

  const playersByGradYear = useMemo(() => {
    const grouped: Record<number, TeamMember[]> = {};
    roster.forEach(member => {
      const year = member.player.grad_year || 2025;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(member);
    });
    return grouped;
  }, [roster]);

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
    return <CoachDashboardSkeleton />;
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f0f1a 100%)`,
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
                <AvatarImage src={coach?.logo_url ?? undefined} alt={`${schoolName} logo`} className="rounded-2xl object-cover" />
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
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 md:p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
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
                <div className="flex items-center gap-4 mt-4">
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
                  {profileCompletion < 100 && (
                    <Link href="/coach/hs/dashboard/settings">
                      <span className="text-[10px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-0.5">
                        Complete profile
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <Link href="/coach/hs/dashboard/settings" className="flex-1 md:flex-none">
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
                onClick={() => toast.info('Public profile coming soon')}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View Public</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          METRIC CARDS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 -mt-5 relative z-10">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          variants={staggerContainer as any}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
              value={roster.length}
              label="Total Players"
              accentColor="#0EA5E9"
            />
          </motion.div>
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<GraduationCap className="w-5 h-5" strokeWidth={1.75} />}
              value={playersByGradYear[2025]?.length || 0}
              label="Seniors (2025)"
              accentColor="#8B5CF6"
            />
          </motion.div>
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<Calendar className="w-5 h-5" strokeWidth={1.75} />}
              value={upcomingEvents.length}
              label="Upcoming Games"
              accentColor="#22C55E"
            />
          </motion.div>
          <motion.div variants={staggerItem as any}>
            <MetricCard
              icon={<MessageSquare className="w-5 h-5" strokeWidth={1.75} />}
              value={conversations.length}
              label="Recent Messages"
              accentColor="#EC4899"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          
          {/* LEFT COLUMN - Players by Grad Year & Schedule */}
          <div className="space-y-5">
            {/* Players by Grad Year */}
            <Card glass className="rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Players by Grad Year
                  </h2>
                  <p className="text-xs text-muted-foreground">Roster overview</p>
                </div>
                <Link href="/coach/high-school/team">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80 gap-1">
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-border/30">
                {Object.keys(playersByGradYear).length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No players on roster yet</p>
                    <Link href="/coach/high-school/team">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Players
                      </Button>
                    </Link>
                  </div>
                ) : (
                  Object.entries(playersByGradYear)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([year, members]) => (
                      <div key={year} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground">Class of {year}</h3>
                          <Badge variant="outline" className="text-xs">{members.length} players</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {members.slice(0, 6).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                              onClick={() => router.push(`/coach/player/${member.player.id}`)}
                            >
                              <Avatar className="h-8 w-8 ring-1 ring-white/10">
                                <AvatarImage src={member.player.avatar_url || undefined} alt={member.player.full_name || 'Player'} />
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-xs">
                                  {member.player.full_name?.slice(0, 2).toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {member.player.full_name || 'Player'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.player.primary_position || 'UTIL'}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                        {members.length > 6 && (
                          <Link href={`/coach/high-school/team?gradYear=${year}`}>
                            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
                              View all {members.length} players
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))
                )}
              </div>
            </Card>

            {/* Upcoming Games */}
            <Card glass className="rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Upcoming Games
                  </h2>
                  <p className="text-xs text-muted-foreground">Next 5 events</p>
                </div>
                <Link href="/coach/high-school/team?tab=schedule">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80 gap-1">
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-border/30">
                {upcomingEvents.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="w-4 h-4" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/coach/high-school/team?tab=schedule&event=${event.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {event.event_name || event.opponent_name || 'Event'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {event.location_name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - Recent Messages */}
          <div className="space-y-5">
            <Card glass className="rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Recent Messages
                  </h2>
                  <p className="text-xs text-muted-foreground">Latest conversations</p>
                </div>
                <Link href="/coach/high-school/messages">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80 gap-1">
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-border/30">
                {conversations.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.conversationId}
                      className="px-5 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/coach/high-school/messages?conversation=${conv.conversationId}`)}
                    >
                      <Avatar className="h-10 w-10 ring-1 ring-white/10">
                        <AvatarImage src={conv.playerAvatar || undefined} alt={conv.playerName} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-sm">
                          {conv.playerName?.slice(0, 2).toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.playerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessageSnippet || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[10px]">
                          {conv.unreadCount}
                        </Badge>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 bg-muted/30 border-t border-border/30">
                <Link href="/coach/high-school/messages">
                  <button className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 group">
                    View all messages
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Metric Card Component
// ═══════════════════════════════════════════════════════════════════════════
interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  accentColor: string;
}

function MetricCard({ icon, value, label, accentColor }: MetricCardProps) {
  const animatedValue = useCountUp(value);

  return (
    <motion.button
      className="group relative backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl shadow-xl shadow-black/20 p-4 md:p-5 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/25 overflow-hidden"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
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
      </div>
      
      <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">{animatedValue.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">{label}</p>
    </motion.button>
  );
}
