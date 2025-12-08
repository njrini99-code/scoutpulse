'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star,
  MessageSquare,
  Video,
  Award,
  School,
  BarChart3,
  Ruler,
  Calendar,
  MapPin,
  Share2,
  Target,
  Trophy,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Eye,
  Heart
} from 'lucide-react';
import type { Player } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

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
  thumbnail_url?: string | null;
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
  strengths: string | null;
  evaluator?: {
    full_name: string | null;
    program_name: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerData();
    checkUserRole();
  }, [playerId]);

  const loadPlayerData = async () => {
    const supabase = createClient();

    // Load player basic info
    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!playerData) {
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
    ] = await Promise.all([
      supabase
        .from('player_metrics')
        .select('*')
        .eq('player_id', playerId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('player_videos')
        .select('*')
        .eq('player_id', playerId)
        .order('recorded_date', { ascending: false }),
      supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', playerId)
        .order('achievement_date', { ascending: false }),
      supabase
        .from('player_evaluations')
        .select(`
          id,
          eval_date,
          overall_grade,
          strengths,
          coaches:evaluator_id (
            full_name,
            program_name
          )
        `)
        .eq('player_id', playerId)
        .eq('is_public', true)
        .order('eval_date', { ascending: false })
        .limit(5),
    ]);

    if (metricsResult.data) setMetrics(metricsResult.data);
    if (videosResult.data) setVideos(videosResult.data);
    if (achievementsResult.data) setAchievements(achievementsResult.data);
    if (evaluationsResult.data) {
      setEvaluations(evaluationsResult.data.map((e: any) => ({
        id: e.id,
        eval_date: e.eval_date,
        overall_grade: e.overall_grade,
        strengths: e.strengths,
        evaluator: e.coaches ? {
          full_name: e.coaches.full_name || null,
          program_name: e.coaches.program_name || null,
        } : undefined,
      })));
    }

    // Track profile view
    trackProfileView(playerId);

    setLoading(false);
  };

  const checkUserRole = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsCoach(false);
      return;
    }

    setCurrentUserId(user.id);

    // Check if user is a coach
    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (coachData) {
      setIsCoach(true);
      checkWatchlist(coachData.id);
    }
  };

  const checkWatchlist = async (coachId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('recruits')
      .select('id')
      .eq('coach_id', coachId)
      .eq('player_id', playerId)
      .maybeSingle();

    setInWatchlist(!!data);
  };

  const trackProfileView = async (playerId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get coach ID if logged in as coach
    let coachId = null;
    if (user) {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (coachData) {
        coachId = coachData.id;
      }
    }

    // Track the view
    await supabase
      .from('player_engagement')
      .insert({
        player_id: playerId,
        coach_id: coachId,
        engagement_type: 'profile_view',
        engagement_date: new Date().toISOString(),
      });
  };

  const handleAddToWatchlist = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to add players to your watchlist');
      router.push('/auth/login');
      return;
    }

    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!coachData) {
      toast.error('Coach profile not found');
      return;
    }

    const { error } = await supabase
      .from('recruits')
      .upsert({
        coach_id: coachData.id,
        player_id: playerId,
        stage: 'Watchlist',
      }, {
        onConflict: 'coach_id,player_id'
      });

    if (error) {
      toast.error('Failed to add to watchlist');
    } else {
      setInWatchlist(true);
      toast.success('Added to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!coachData) return;

    const { error } = await supabase
      .from('recruits')
      .delete()
      .eq('coach_id', coachData.id)
      .eq('player_id', playerId);

    if (error) {
      toast.error('Failed to remove from watchlist');
    } else {
      setInWatchlist(false);
      toast.success('Removed from watchlist');
    }
  };

  const handleMessage = () => {
    if (!isCoach) {
      toast.error('Please log in as a coach to message players');
      router.push('/auth/login');
      return;
    }
    // Navigate to messages with this player
    router.push(`/coach/messages?playerId=${playerId}`);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/player/${playerId}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A3B2E] via-[#0B0D0F] to-[#0B0D0F] flex items-center justify-center">
        <div className="w-8 h-8 bg-[#00C27A]/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A3B2E] via-[#0B0D0F] to-[#0B0D0F]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="py-20 text-center">
              <p className="text-slate-300 text-lg mb-4">Player profile not found</p>
              <Link href="/">
                <Button variant="outline" className="border-[#00C27A] text-[#00C27A] hover:bg-[#00C27A]/10">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();
  const initials = `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase();
  const height = player.height_feet && player.height_inches !== null
    ? `${player.height_feet}'${player.height_inches}"`
    : null;

  // Group metrics by type
  const velocityMetrics = metrics.filter(m => m.metric_type === 'velocity');
  const speedMetrics = metrics.filter(m => m.metric_type === 'speed');
  const powerMetrics = metrics.filter(m => m.metric_type === 'power');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A3B2E] via-[#0B0D0F] to-[#0B0D0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* Hero Section */}
        <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A3B2E] via-[#0B1410] to-[#0B0D0F] p-8 sm:p-12 border border-white/10">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00C27A]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-[#00C27A]/30 ring-4 ring-white/5 shadow-2xl">
                <AvatarImage src={player.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#00C27A] to-emerald-600 text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Player Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">{fullName}</h1>
                  {player.verified_metrics && (
                    <Badge className="bg-[#00C27A]/20 text-[#00C27A] border-[#00C27A]/30 px-3 py-1">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-slate-300 mb-4">
                  {player.primary_position && (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Target className="w-4 h-4 text-[#00C27A]" />
                      <span className="font-medium">{player.primary_position}</span>
                      {player.secondary_position && (
                        <span className="text-slate-400">/ {player.secondary_position}</span>
                      )}
                    </span>
                  )}
                  {player.grad_year && (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">Class of {player.grad_year}</span>
                    </span>
                  )}
                  {height && (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Ruler className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">
                        {height}
                        {player.weight_lbs && ` • ${player.weight_lbs} lbs`}
                      </span>
                    </span>
                  )}
                  {player.throws && player.bats && (
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <span className="font-medium">{player.throws}/{player.bats}</span>
                    </span>
                  )}
                </div>

                {/* Location */}
                {player.high_school_name && (
                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <School className="w-4 h-4" />
                    <span>{player.high_school_name}</span>
                    {player.high_school_city && player.high_school_state && (
                      <>
                        <span>•</span>
                        <MapPin className="w-4 h-4" />
                        <span>{player.high_school_city}, {player.high_school_state}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Bio */}
                {player.about_me && (
                  <p className="text-slate-300 max-w-2xl mb-6 leading-relaxed">
                    {player.about_me}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isCoach ? (
                    <>
                      {inWatchlist ? (
                        <Button
                          onClick={handleRemoveFromWatchlist}
                          variant="outline"
                          className="gap-2 border-[#00C27A]/30 text-[#00C27A] hover:bg-[#00C27A]/10"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                          In Watchlist
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAddToWatchlist}
                          className="gap-2 bg-[#00C27A] hover:bg-[#00d889] text-white"
                        >
                          <Star className="w-4 h-4" />
                          Add to Watchlist
                        </Button>
                      )}
                      <Button
                        onClick={handleMessage}
                        variant="outline"
                        className="gap-2 border-white/20 hover:bg-white/5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Button>
                    </>
                  ) : currentUserId !== player.user_id && (
                    <Link href="/auth/login">
                      <Button className="gap-2 bg-[#00C27A] hover:bg-[#00d889] text-white">
                        <MessageSquare className="w-4 h-4" />
                        Log in to Connect
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="gap-2 border-white/20 hover:bg-white/5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#00C27A] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats & Metrics
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-[#00C27A] data-[state=active]:text-white">
              <Video className="w-4 h-4 mr-2" />
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-[#00C27A] data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="data-[state=active]:bg-[#00C27A] data-[state=active]:text-white">
              <Award className="w-4 h-4 mr-2" />
              Evaluations
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {metrics.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No metrics recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Velocity Metrics */}
                {velocityMetrics.length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#00C27A]" />
                        Velocity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {velocityMetrics.map((metric) => (
                        <div key={metric.id} className="flex justify-between items-center">
                          <span className="text-slate-400">{metric.metric_label}</span>
                          <span className="text-white font-semibold">{metric.metric_value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Speed Metrics */}
                {speedMetrics.length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Speed
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {speedMetrics.map((metric) => (
                        <div key={metric.id} className="flex justify-between items-center">
                          <span className="text-slate-400">{metric.metric_label}</span>
                          <span className="text-white font-semibold">{metric.metric_value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Power Metrics */}
                {powerMetrics.length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Power
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {powerMetrics.map((metric) => (
                        <div key={metric.id} className="flex justify-between items-center">
                          <span className="text-slate-400">{metric.metric_label}</span>
                          <span className="text-white font-semibold">{metric.metric_value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Other Metrics */}
                {metrics.filter(m => !['velocity', 'speed', 'power'].includes(m.metric_type)).length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        Other Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {metrics
                        .filter(m => !['velocity', 'speed', 'power'].includes(m.metric_type))
                        .map((metric) => (
                          <div key={metric.id} className="flex justify-between items-center">
                            <span className="text-slate-400">{metric.metric_label}</span>
                            <span className="text-white font-semibold">{metric.metric_value}</span>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {videos.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-12 text-center">
                  <Video className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No videos uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <Card key={video.id} className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden group hover:border-[#00C27A]/30 transition-colors">
                    <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative">
                      {video.thumbnail_url ? (
                        <Image
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#00C27A] text-white rounded-lg hover:bg-[#00d889] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Watch
                        </a>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-white text-base">{video.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Badge variant="outline" className="border-white/20">
                          {video.video_type}
                        </Badge>
                        {video.recorded_date && (
                          <span>{new Date(video.recorded_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            {achievements.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No achievements recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:border-[#00C27A]/30 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00C27A]/20 flex items-center justify-center">
                          <Award className="w-5 h-5 text-[#00C27A]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{achievement.achievement_text}</p>
                          {achievement.achievement_date && (
                            <p className="text-sm text-slate-400 mt-1">
                              {new Date(achievement.achievement_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations">
            {evaluations.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No public evaluations yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <Card key={evaluation.id} className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          {evaluation.evaluator?.program_name && (
                            <CardTitle className="text-white text-lg mb-1">
                              {evaluation.evaluator.program_name}
                            </CardTitle>
                          )}
                          {evaluation.evaluator?.full_name && (
                            <p className="text-slate-400 text-sm">by {evaluation.evaluator.full_name}</p>
                          )}
                        </div>
                        {evaluation.overall_grade !== null && (
                          <Badge className="bg-[#00C27A]/20 text-[#00C27A] border-[#00C27A]/30 text-lg px-4 py-1">
                            {evaluation.overall_grade}/10
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {evaluation.strengths && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Strengths:</h4>
                          <p className="text-slate-400">{evaluation.strengths}</p>
                        </div>
                      )}
                      <p className="text-xs text-slate-500">
                        {new Date(evaluation.eval_date).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Contact CTA for non-coaches */}
        {!isCoach && currentUserId !== player.user_id && (
          <Card className="mt-8 bg-gradient-to-r from-[#00C27A]/10 to-emerald-600/10 border-[#00C27A]/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Interested in recruiting {player.first_name}?</h3>
              <p className="text-slate-300 mb-6">
                Log in as a coach to message, add to watchlist, and track recruiting progress.
              </p>
              <Link href="/auth/login">
                <Button size="lg" className="bg-[#00C27A] hover:bg-[#00d889] text-white">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
