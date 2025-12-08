'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CardSkeleton } from '@/components/ui/loading-state';
import { EmptyState, NoStatsEmptyState, NoSchoolsEmptyState } from '@/components/ui/empty-state';
import { AddVideoModal } from '@/components/player/AddVideoModal';
import { AddStatsModal } from '@/components/player/AddStatsModal';
import { AddAchievementModal } from '@/components/player/AddAchievementModal';
import { AddMetricModal } from '@/components/player/AddMetricModal';
import { AnalyticsDashboard } from '@/components/player/AnalyticsDashboard';
import { D1Badge } from '@/components/ui/D1Badge';
import { checkD1Standard, parseMetricValue } from '@/lib/constants/d1-benchmarks';
import {
  User,
  MapPin,
  Target,
  Video,
  Award,
  TrendingUp,
  TrendingDown,
  Edit,
  Plus,
  ExternalLink,
  Loader2,
  Share2,
  School,
  CheckCircle2,
  Ruler,
  BarChart3,
  Star,
  Calendar,
  Clock,
  Trophy,
  Heart,
  Eye,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  Users,
  Bookmark,
  Sparkles,
  ArrowUpRight,
  Building2,
  Trash2,
} from 'lucide-react';
import type { Player } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getPlayerStatsSeries, type PlayerStatsSummary, type PerformanceFilters, type PlayerGameSeriesPoint } from '@/lib/api/player/getPlayerStatsSeries';
import { getPlayerRecruitingSnapshot, type PlayerRecruitingSnapshot } from '@/lib/api/player/getPlayerRecruitingSnapshot';
import { PlayerStatsCharts } from '@/components/player/PlayerStatsCharts';
import { getConversationsForPlayer, type ConversationListItem } from '@/lib/api/messaging/getConversationsForCoach';
import { getPlayerEventsTimeline, type PlayerEventTimelineItem, type EventFilter } from '@/lib/api/player/getPlayerEventsTimeline';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerMetric {
  id: string;
  metric_label: string;
  metric_value: string;
  metric_type: string;
  verified_date: string | null;
  updated_at: string;
}

interface PlayerVideo {
  id: string;
  title: string;
  video_type: string;
  video_url: string;
  recorded_date: string | null;
}

interface PlayerAchievement {
  id: string;
  achievement_text: string;
  achievement_date: string | null;
}

interface Evaluation {
  id: string;
  eval_date: string;
  overall_grade: number | null;
  arm_grade: number | null;
  bat_grade: number | null;
  speed_grade: number | null;
  fielding_grade: number | null;
  baseball_iq_grade: number | null;
  strengths: string | null;
  areas_to_improve: string | null;
  notes: string | null;
  is_public: boolean;
  evaluator?: {
    full_name: string | null;
    program_name: string | null;
  };
}

interface PlayerEngagement {
  profile_views_count: number;
  watchlist_adds_count: number;
  recent_views_7d: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerDashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [engagement, setEngagement] = useState<PlayerEngagement | null>(null);
  const [statsSummary, setStatsSummary] = useState<PlayerStatsSummary | null>(null);
  const [statsSeries, setStatsSeries] = useState<PlayerGameSeriesPoint[]>([]);
  const [recruitingData, setRecruitingData] = useState<PlayerRecruitingSnapshot | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<PlayerEventTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsDateRange, setStatsDateRange] = useState<'7d' | '30d' | 'season'>('season');
  const [teamHubTab, setTeamHubTab] = useState<'messages' | 'schedule'>('messages');
  const [collegeJourneyTab, setCollegeJourneyTab] = useState<'matches' | 'favorites' | 'interested'>('matches');
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, []);

  // Sticky tabs detection
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const rect = tabsRef.current.getBoundingClientRect();
        setIsTabsSticky(rect.top <= 80);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPlayerData = async () => {
    const supabase = createClient();
    
    let playerData = null;
    
    if (isDevMode()) {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('id', DEV_ENTITY_IDS.player)
        .single();
      playerData = data;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();
      playerData = data;
    }

    if (!playerData) {
      if (!isDevMode()) {
        router.push('/onboarding/player');
      }
      setLoading(false);
      return;
    }

    setPlayer(playerData);

    // Load all related data in parallel
    const [
      metricsResult,
      videosResult,
      achievementsResult,
      evaluationsResult,
      engagementResult,
    ] = await Promise.all([
      supabase
        .from('player_metrics')
        .select('*')
        .eq('player_id', playerData.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('player_videos')
        .select('*')
        .eq('player_id', playerData.id)
        .order('recorded_date', { ascending: false }),
      supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', playerData.id)
        .order('achievement_date', { ascending: false }),
      supabase
        .from('evaluations')
        .select(`
          *,
          evaluator:evaluator_id (
            full_name,
            program_name
          )
        `)
        .eq('player_id', playerData.id)
        .order('eval_date', { ascending: false }),
      supabase
        .from('player_engagement')
        .select('profile_views_count, watchlist_adds_count, recent_views_7d')
        .eq('player_id', playerData.id)
        .maybeSingle(),
    ]);

    if (metricsResult.data) setMetrics(metricsResult.data);
    if (videosResult.data) setVideos(videosResult.data);
    if (achievementsResult.data) setAchievements(achievementsResult.data);
    if (evaluationsResult.data) setEvaluations(evaluationsResult.data);
    if (engagementResult.data) setEngagement(engagementResult.data);

    // Load stats
    const filters: PerformanceFilters = {
      source: 'all',
      dateRange: { from: null, to: null, preset: 'season' },
    };
    const statsResponse = await getPlayerStatsSeries(playerData.id, filters);
    setStatsSummary(statsResponse.summary);
    setStatsSeries(statsResponse.series);

    // Load recruiting data
    const recruiting = await getPlayerRecruitingSnapshot(playerData.id);
    setRecruitingData(recruiting);

    // Load conversations
    const convos = await getConversationsForPlayer(playerData.id);
    setConversations(convos);

    // Load upcoming events
    const eventFilter: EventFilter = {
      type: 'all',
      range: { from: null, to: null, preset: '30d' },
    };
    const events = await getPlayerEventsTimeline(playerData.id, eventFilter);
    const upcoming = events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    setUpcomingEvents(upcoming);

    setLoading(false);
  };

  const refreshData = () => {
    loadPlayerData();
  };

  // Computed values
  const fullName = player?.full_name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim() || 'Player';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const location = player?.high_school_city && player?.high_school_state 
    ? `${player.high_school_city}, ${player.high_school_state}` 
    : player?.high_school_state || null;
  
  const gameVideos = videos.filter(v => v.video_type === 'Game');
  const trainingVideos = videos.filter(v => v.video_type === 'Training');
  
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const collegeInterestCount = recruitingData?.summary?.totalSchools || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1720] via-[#0f172a] to-[#f4f7fb]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="h-44 rounded-2xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 rounded-3xl bg-white/5 animate-pulse" />
            <div className="h-80 rounded-3xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1720] via-[#0f172a] to-[#f4f7fb] flex items-center justify-center">
        <EmptyState 
          title="Profile not found"
          description="We couldn't find your player profile. Please complete onboarding first."
          actionLabel="Go to Onboarding"
          onAction={() => router.push('/onboarding/player')}
          icon={<User className="h-8 w-8" />}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          DARK HERO ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-[#0b1720] via-[#0d1f2d] to-[#0f172a] pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 space-y-6">
          
          {/* A. HERO PROFILE BANNER */}
          <section className="relative">
            {/* Background with subtle grid */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-emerald-900/10" />
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Floating Glass Hero Card */}
            <div className="relative p-1">
              <div 
                className="relative bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/[0.12] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] hover:border-emerald-400/20 transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-2 ring-white/30 shadow-[0_12px_35px_rgba(0,0,0,0.4)] group-hover:ring-emerald-400/40 transition-all duration-300">
                      <AvatarImage src={player.avatar_url ?? undefined} alt={fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h1 className="text-2xl md:text-3xl font-semibold text-white">{fullName}</h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {player.grad_year && (
                          <span className="text-sm text-white/70">Class of {player.grad_year}</span>
                        )}
                        {player.primary_position && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                            {player.primary_position}
                          </span>
                        )}
                        {location && (
                          <span className="flex items-center gap-1 text-sm text-white/60">
                            <MapPin className="w-3.5 h-3.5" />
                            {location}
                          </span>
                        )}
                      </div>
                      {player.primary_goal && (
                        <p className="mt-2 text-sm text-white/60 italic">
                          "{player.primary_goal}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="flex gap-2">
                      <Button 
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium gap-2 shadow-lg shadow-emerald-500/25 transition-all duration-150 hover:-translate-y-0.5"
                        onClick={() => router.push('/player/profile')}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline"
                        className="bg-white/[0.05] border-white/[0.15] text-white hover:bg-white/[0.1] hover:border-white/25 gap-2 transition-all duration-150 hover:-translate-y-0.5"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/player/' + player.id);
                          toast.success('Profile link copied!');
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </div>
                    <button 
                      className="text-xs text-emerald-300/80 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      onClick={() => window.open(`/player/${player.id}`, '_blank')}
                    >
                      View public profile
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* B. STAT CARDS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <GlassStatCard
              icon={<Eye className="w-4 h-4" />}
              value={engagement?.recent_views_7d ?? 0}
              label="Profile Views"
              sublabel="Last 7 days"
              trend={engagement && engagement.recent_views_7d > 5 ? 12 : undefined}
            />
            <GlassStatCard
              icon={<GraduationCap className="w-4 h-4" />}
              value={collegeInterestCount}
              label="College Interest"
              sublabel="Schools tracking you"
            />
            <GlassStatCard
              icon={<Bookmark className="w-4 h-4" />}
              value={engagement?.watchlist_adds_count ?? 0}
              label="Watchlist Adds"
              sublabel="Coaches saved you"
              trend={engagement && engagement.watchlist_adds_count > 3 ? 8 : undefined}
            />
            <GlassStatCard
              icon={<MessageSquare className="w-4 h-4" />}
              value={unreadMessages}
              label="Team Messages"
              sublabel={unreadMessages > 0 ? 'Unread' : 'All caught up'}
              highlight={unreadMessages > 0}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TRANSITION GRADIENT + LIGHT CONTENT ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#f4f7fb]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
          
          {/* C. TEAM HUB & COLLEGE JOURNEY */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* TEAM HUB */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden hover:border-white/20 transition-all duration-300">
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-white/[0.08]">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Team Hub</h3>
                    <p className="text-xs text-white/50">Messages & schedule from your coaches</p>
                  </div>
                </div>
                
                {/* Segmented Control */}
                <div className="flex gap-1 mt-4 p-1 bg-white/[0.06] rounded-full w-fit">
                  <button
                    onClick={() => setTeamHubTab('messages')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                      teamHubTab === 'messages' 
                        ? 'bg-white text-emerald-700' 
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => setTeamHubTab('schedule')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                      teamHubTab === 'schedule' 
                        ? 'bg-white text-emerald-700' 
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    Schedule
                  </button>
                </div>

                {/* Content */}
                <div className="mt-5">
                  {teamHubTab === 'messages' ? (
                    conversations.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                          <MessageSquare className="w-7 h-7 text-white/30" />
                        </div>
                        <p className="text-sm text-white/70 font-medium">No messages yet</p>
                        <p className="text-xs text-white/40 mt-1 max-w-[200px] mx-auto">
                          When your coaches message the team, it will show up here.
                        </p>
                        <button 
                          onClick={() => router.push('/player/messages')}
                          className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mx-auto transition-colors"
                        >
                          Open Messages <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {conversations.slice(0, 4).map((convo) => (
                          <button
                            key={convo.conversationId}
                            onClick={() => router.push('/player/messages')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all duration-150 text-left group"
                          >
                            <Avatar className="h-10 w-10 ring-1 ring-white/10">
                              <AvatarImage src={(convo as any).programLogo ?? undefined} />
                              <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-sm">
                                {convo.title?.slice(0, 2).toUpperCase() || 'TM'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white/90 text-sm truncate">{convo.title}</p>
                              <p className="text-xs text-white/50 truncate">{convo.lastMessageSnippet || 'No messages'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {convo.lastMessageAt && (
                                <span className="text-[10px] text-white/40">
                                  {formatTimeAgo(convo.lastMessageAt)}
                                </span>
                              )}
                              {convo.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
                                  {convo.unreadCount}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                        <button 
                          onClick={() => router.push('/player/messages')}
                          className="w-full mt-2 py-2.5 text-xs text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 rounded-xl hover:bg-white/[0.03] transition-all"
                        >
                          Open Messages <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    upcomingEvents.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                          <Calendar className="w-7 h-7 text-white/30" />
                        </div>
                        <p className="text-sm text-white/70 font-medium">No upcoming events</p>
                        <p className="text-xs text-white/40 mt-1">Games and practices will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingEvents.slice(0, 4).map((event) => (
                          <div
                            key={event.eventId}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                          >
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-medium text-emerald-400 uppercase">
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="text-lg font-bold text-emerald-300">
                                {new Date(event.date).getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white/90 text-sm truncate">{event.label}</p>
                              <p className="text-xs text-white/50">
                                {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                {event.location && ` • ${event.location}`}
                              </p>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => router.push('/player/team')}
                          className="w-full mt-2 py-2.5 text-xs text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 rounded-xl hover:bg-white/[0.03] transition-all"
                        >
                          View Full Calendar <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* COLLEGE JOURNEY */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden hover:border-white/20 transition-all duration-300">
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-white/[0.08]">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">College Journey</h3>
                    <p className="text-xs text-white/50">Your path to the next level</p>
                  </div>
                </div>
                
                {/* Segmented Control */}
                <div className="flex gap-1 mt-4 p-1 bg-white/[0.06] rounded-full w-fit">
                  <button
                    onClick={() => setCollegeJourneyTab('matches')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                      collegeJourneyTab === 'matches' 
                        ? 'bg-white text-purple-700' 
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    Matches
                  </button>
                  <button
                    onClick={() => setCollegeJourneyTab('favorites')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                      collegeJourneyTab === 'favorites' 
                        ? 'bg-white text-purple-700' 
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    Favorites
                  </button>
                  <button
                    onClick={() => setCollegeJourneyTab('interested')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                      collegeJourneyTab === 'interested' 
                        ? 'bg-white text-purple-700' 
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    Interested
                  </button>
                </div>

                {/* Content */}
                <div className="mt-5">
                  {recruitingData && recruitingData.schools.length > 0 ? (
                    <div>
                      <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-3 pb-3">
                          {recruitingData.schools.slice(0, 8).map((school) => (
                            <button
                              key={school.id}
                              onClick={() => router.push('/player/discover')}
                              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-400/30 hover:bg-white/[0.06] transition-all duration-150 group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-purple-400" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-white/90 truncate max-w-[100px]">{school.name}</p>
                                <p className="text-[10px] text-white/50">{school.conference || 'College'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="opacity-50" />
                      </ScrollArea>
                      
                      {recruitingData.summary && (
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="text-center">
                            <p className="text-xl font-bold text-white">{recruitingData.summary.totalSchools}</p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wide">Schools</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-emerald-400">{recruitingData.summary.offers}</p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wide">Offers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-purple-400">{recruitingData.summary.visits}</p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wide">Visits</p>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => router.push('/player/discover')}
                        className="w-full mt-4 py-2.5 text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 rounded-xl hover:bg-white/[0.03] transition-all"
                      >
                        Find Schools <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                        <Building2 className="w-7 h-7 text-white/30" />
                      </div>
                      <p className="text-sm text-white/70 font-medium">No matches yet</p>
                      <p className="text-xs text-white/40 mt-1 max-w-[200px] mx-auto">
                        Fill out your profile and start exploring colleges.
                      </p>
                      <Button 
                        className="mt-4 bg-purple-500 hover:bg-purple-400 text-white text-xs"
                        onClick={() => router.push('/player/discover')}
                      >
                        Find Schools
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LIGHT CONTENT ZONE - TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#f4f7fb]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div 
            ref={tabsRef}
            className={`sticky top-[56px] z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-3 transition-all ${
              isTabsSticky ? 'bg-[#f4f7fb]/95 backdrop-blur-sm border-b border-slate-200/50' : ''
            }`}
          >
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="w-full md:w-auto flex overflow-x-auto gap-1 p-1.5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <TabsTrigger value="analytics" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Stats
                </TabsTrigger>
                <TabsTrigger value="measurables" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Measurables
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Evaluations
                </TabsTrigger>
                <TabsTrigger value="recruiting" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Recruiting
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Videos
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="about" className="flex-shrink-0 px-4 py-2 text-sm rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                  About
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="analytics" className="mt-6">
                {player && <AnalyticsDashboard playerId={player.id} timeRange={30} />}
              </TabsContent>

              <TabsContent value="stats" className="mt-6 space-y-6">
                {/* Quick Stats Summary Card */}
                <LightCard>
                  <LightCardHeader 
                    icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
                    title="Season Statistics"
                    action={
                      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                        {(['season', '30d', '7d'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setStatsDateRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                              statsDateRange === range 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {range === 'season' ? 'Season' : range === '30d' ? '30 Days' : '7 Days'}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  <div className="p-5">
                    {statsSummary && statsSummary.gamesPlayed > 0 ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hitting</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <LightStatTile label="AVG" value={statsSummary.battingAvg.toFixed(3)} />
                            <LightStatTile label="Games" value={statsSummary.gamesPlayed.toString()} />
                            <LightStatTile label="HR" value={statsSummary.homeRuns.toString()} />
                            <LightStatTile label="RBI/G" value={statsSummary.rbisPerGame.toFixed(1)} />
                          </div>
                        </div>
                        {statsSummary.era > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pitching</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <LightStatTile label="ERA" value={statsSummary.era.toFixed(2)} />
                              <LightStatTile label="K/G" value={statsSummary.strikeoutsPerGame.toFixed(1)} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <NoStatsEmptyState onAction={() => {}} />
                    )}
                  </div>
                </LightCard>

                {/* Performance Charts & Trends */}
                {statsSummary && statsSummary.gamesPlayed > 0 && (
                  <PlayerStatsCharts 
                    series={statsSeries}
                    summary={statsSummary}
                    position={player.primary_position || 'default'}
                    dateRange={statsDateRange}
                  />
                )}
              </TabsContent>

              <TabsContent value="measurables" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<Ruler className="w-5 h-5 text-emerald-600" />}
                    title="Measurables & Tools"
                    action={
                      <AddMetricModal
                        playerId={player.id}
                        onSuccess={refreshData}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        }
                      />
                    }
                  />
                  <div className="p-5">
                    <div className="grid md:grid-cols-2 gap-3">
                      <LightStatTile 
                        label="Height" 
                        value={player.height_feet && player.height_inches !== null
                          ? `${player.height_feet}'${player.height_inches}"`
                          : 'Not set'
                        } 
                      />
                      <LightStatTile label="Weight" value={player.weight_lbs ? `${player.weight_lbs} lbs` : 'Not set'} />
                      <LightStatTile label="Throws" value={player.throws || 'Not set'} />
                      <LightStatTile label="Bats" value={player.bats || 'Not set'} />
                    </div>
                    {metrics.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Additional Metrics</h4>
                        {metrics.map((metric) => {
                          const numericValue = parseMetricValue(metric.metric_value);
                          const d1Level = numericValue !== null ? checkD1Standard(metric.metric_label, numericValue) : 'none';

                          return (
                            <div key={metric.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm">{metric.metric_label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {metric.verified_date && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                    </Badge>
                                  )}
                                  <D1Badge level={d1Level} size="sm" />
                                </div>
                              </div>
                              <p className="text-lg font-bold text-slate-900 ml-3">{metric.metric_value}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </LightCard>
              </TabsContent>

              <TabsContent value="evaluations" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<Star className="w-5 h-5 text-amber-500" />}
                    title="Coach Evaluations"
                  />
                  <div className="p-5">
                    {evaluations.length === 0 ? (
                      <EmptyState
                        icon={<Star className="h-8 w-8" />}
                        title="No evaluations yet"
                        description="Attend camps and showcases to receive coach evaluations."
                        actionLabel="Find Camps"
                        onAction={() => router.push('/player/discover')}
                      />
                    ) : (
                      <div className="space-y-4">
                        {evaluations.map((evaluation) => (
                          <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                        ))}
                      </div>
                    )}
                  </div>
                </LightCard>
              </TabsContent>

              <TabsContent value="recruiting" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<GraduationCap className="w-5 h-5 text-purple-600" />}
                    title="Recruiting Interests"
                    action={
                      <Button variant="outline" size="sm" onClick={() => router.push('/player/profile?tab=recruiting')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add School
                      </Button>
                    }
                  />
                  <div className="p-5">
                    {recruitingData && recruitingData.schools.length > 0 ? (
                      <div className="space-y-6">
                        {recruitingData.summary && (
                          <div className="grid grid-cols-3 gap-4">
                            <LightStatTile label="Schools" value={recruitingData.summary.totalSchools.toString()} />
                            <LightStatTile label="Offers" value={recruitingData.summary.offers.toString()} accent />
                            <LightStatTile label="Visits" value={recruitingData.summary.visits.toString()} />
                          </div>
                        )}
                        <div className="space-y-2">
                          {recruitingData.schools.map((school) => (
                            <div key={school.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <School className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">{school.name}</p>
                                  {school.conference && <p className="text-xs text-slate-500">{school.conference}</p>}
                                </div>
                              </div>
                              <Badge className={getStatusBadgeClass(school.status)}>
                                {school.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <NoSchoolsEmptyState onAction={() => router.push('/player/profile?tab=recruiting')} />
                    )}
                  </div>
                </LightCard>
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<Video className="w-5 h-5 text-red-500" />}
                    title="Videos"
                    action={
                      <AddVideoModal
                        playerId={player.id}
                        onSuccess={refreshData}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add Video
                          </Button>
                        }
                      />
                    }
                  />
                  <div className="p-5">
                    <Tabs defaultValue="game" className="space-y-4">
                      <TabsList className="bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="game" className="text-sm rounded-md">Game ({gameVideos.length})</TabsTrigger>
                        <TabsTrigger value="training" className="text-sm rounded-md">Training ({trainingVideos.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="game">
                        {gameVideos.length === 0 ? (
                          <div className="text-center py-12">
                            <Video className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">No game videos yet</p>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gameVideos.map((video) => (
                              <VideoCard key={video.id} video={video} onDelete={refreshData} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="training">
                        {trainingVideos.length === 0 ? (
                          <div className="text-center py-12">
                            <Video className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">No training videos yet</p>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trainingVideos.map((video) => (
                              <VideoCard key={video.id} video={video} onDelete={refreshData} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </LightCard>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<Trophy className="w-5 h-5 text-amber-500" />}
                    title="Achievements"
                    action={
                      <AddAchievementModal
                        playerId={player.id}
                        onSuccess={refreshData}
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        }
                      />
                    }
                  />
                  <div className="p-5">
                    {achievements.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">No achievements yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {achievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                            <Award className="w-5 h-5 mt-0.5 text-amber-500" />
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{achievement.achievement_text}</p>
                              {achievement.achievement_date && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(achievement.achievement_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </LightCard>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <LightCard>
                  <LightCardHeader 
                    icon={<User className="w-5 h-5 text-emerald-600" />}
                    title="About Me"
                  />
                  <div className="p-5 space-y-4">
                    {player.about_me ? (
                      <p className="text-slate-600 leading-relaxed">{player.about_me}</p>
                    ) : (
                      <p className="text-slate-400 italic">No bio yet. Add one to tell coaches about yourself.</p>
                    )}
                    {player.primary_goal && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Goal</h4>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Target className="w-3 h-3 mr-1" />
                          {player.primary_goal}
                        </Badge>
                      </div>
                    )}
                    {player.top_schools && player.top_schools.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dream Schools</h4>
                        <div className="flex flex-wrap gap-2">
                          {player.top_schools.slice(0, 5).map((school, idx) => (
                            <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200">
                              <School className="w-3 h-3 mr-1" />
                              {school}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {player.high_school_name && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">High School</h4>
                        <p className="text-slate-700">{player.high_school_name}</p>
                      </div>
                    )}
                    {player.showcase_team_name && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Showcase Team</h4>
                        <p className="text-slate-700">{player.showcase_team_name}</p>
                      </div>
                    )}
                  </div>
                </LightCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════════

function GlassStatCard({ 
  icon, 
  value, 
  label, 
  sublabel,
  trend,
  highlight,
}: { 
  icon: React.ReactNode;
  value: number;
  label: string;
  sublabel?: string;
  trend?: number;
  highlight?: boolean;
}) {
  return (
    <div className={`relative p-4 rounded-2xl bg-white/[0.08] backdrop-blur-lg border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-default group ${
      highlight ? 'border-amber-400/30' : 'border-white/[0.12] hover:border-emerald-400/30'
    }`}>
      {/* Trend badge */}
      {trend !== undefined && (
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
          <TrendingUp className="w-3 h-3" />
          +{trend}%
        </span>
      )}
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-white/[0.1] text-white/70 group-hover:text-emerald-400 transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-white">{value}</p>
          <p className="text-xs text-white/70 font-medium">{label}</p>
          {sublabel && <p className="text-[10px] text-white/50">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function LightCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      {children}
    </div>
  );
}

function LightCardHeader({ 
  icon, 
  title, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function LightStatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
      <p className={`text-2xl font-bold ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function VideoCard({ video, onDelete }: { video: PlayerVideo; onDelete?: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('player_videos')
        .delete()
        .eq('id', video.id);

      if (error) {
        toast.error('Failed to delete video');
        console.error(error);
        return;
      }

      toast.success('Video deleted successfully');
      onDelete?.(video.id);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden hover:shadow-md transition-all group relative">
      <div className="aspect-video bg-slate-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="w-10 h-10 text-slate-400" />
        </div>
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-6 h-6 text-white" />
        </a>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Delete video"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-slate-800 text-sm truncate">{video.title}</p>
        {video.recorded_date && (
          <p className="text-xs text-slate-500">{new Date(video.recorded_date).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
  const grades = [
    { label: 'Overall', value: evaluation.overall_grade },
    { label: 'Arm', value: evaluation.arm_grade },
    { label: 'Bat', value: evaluation.bat_grade },
    { label: 'Speed', value: evaluation.speed_grade },
    { label: 'Fielding', value: evaluation.fielding_grade },
    { label: 'IQ', value: evaluation.baseball_iq_grade },
  ].filter(g => g.value !== null);

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-slate-800 text-sm">
            {evaluation.evaluator?.program_name || evaluation.evaluator?.full_name || 'Coach'}
          </p>
          <p className="text-xs text-slate-500">{new Date(evaluation.eval_date).toLocaleDateString()}</p>
        </div>
        {evaluation.overall_grade && (
          <div className="text-2xl font-bold text-emerald-600">{evaluation.overall_grade.toFixed(1)}</div>
        )}
      </div>
      {grades.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {grades.slice(0, 6).map((grade) => (
            <div key={grade.label} className="text-center p-2 rounded-lg bg-white">
              <p className="text-xs text-slate-500">{grade.label}</p>
              <p className="font-semibold text-slate-800">{grade.value?.toFixed(1)}</p>
            </div>
          ))}
        </div>
      )}
      {evaluation.strengths && (
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase">Strengths</p>
          <p className="text-sm text-slate-700">{evaluation.strengths}</p>
        </div>
      )}
      {evaluation.areas_to_improve && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase">Areas to Improve</p>
          <p className="text-sm text-slate-700">{evaluation.areas_to_improve}</p>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'committed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'offered':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'visited':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'interested':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
