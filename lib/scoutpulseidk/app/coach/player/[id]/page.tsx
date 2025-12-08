'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Star,
  MessageSquare,
  FileText,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Video,
  Award,
  School,
  BarChart3,
  Ruler,
  Eye,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeft,
  Edit,
  Download,
  Target,
  Phone,
  Mail,
  Clock,
  Send,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Zap,
  Activity,
  Users,
  GraduationCap,
  CalendarPlus,
  Share2,
  MoreHorizontal,
  Trash2,
  Pin,
  X,
  Check,
} from 'lucide-react';
import type { Player } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { GlassProgressBar } from '@/components/ui/GlassProgressBar';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerMetric {
  id: string;
  metric_label: string;
  metric_value: string;
  metric_type: string;
  verified_date: string | null;
}

interface PlayerVideo {
  id: string;
  title: string;
  video_type: 'Game' | 'Training' | 'Highlights';
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  recorded_date: string | null;
  views?: number;
}

interface PlayerAchievement {
  id: string;
  achievement_text: string;
  achievement_date: string | null;
}

interface ContactHistory {
  id: string;
  type: 'email' | 'call' | 'text' | 'visit' | 'camp' | 'other';
  date: string;
  description: string;
  outcome?: string;
  followUp?: string;
  coachName?: string;
}

interface RecruitmentNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  coachName: string;
  isPinned?: boolean;
  category?: 'general' | 'evaluation' | 'visit' | 'academic' | 'character';
}

interface PlayerStats {
  hitting: {
    avg: string;
    obp: string;
    slg: string;
    ops: string;
    hr: number;
    rbi: number;
    sb: number;
    games: number;
  };
  pitching: {
    era: string;
    whip: string;
    kPer9: string;
    wins: number;
    saves: number;
    ip: string;
    so: number;
    games: number;
  };
  fielding: {
    fieldingPct: string;
    putouts: number;
    assists: number;
    errors: number;
    doublePlays: number;
    games: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_CONTACT_HISTORY: ContactHistory[] = [
  { id: 'c1', type: 'email', date: '2024-11-10', description: 'Sent initial recruiting questionnaire', outcome: 'Player responded within 24 hours', coachName: 'Coach Williams' },
  { id: 'c2', type: 'call', date: '2024-11-08', description: 'Phone call to discuss program and opportunities', outcome: 'Very interested, wants to visit', followUp: '2024-11-15', coachName: 'Coach Williams' },
  { id: 'c3', type: 'camp', date: '2024-10-20', description: 'Attended fall prospect camp', outcome: 'Impressed with arm strength and work ethic', coachName: 'Coach Davis' },
  { id: 'c4', type: 'visit', date: '2024-10-05', description: 'Unofficial campus visit', outcome: 'Player loved the facilities', coachName: 'Coach Williams' },
  { id: 'c5', type: 'text', date: '2024-09-28', description: 'Quick check-in about upcoming showcase', outcome: 'Confirmed attendance', coachName: 'Coach Williams' },
];

const MOCK_NOTES: RecruitmentNote[] = [
  { id: 'n1', content: 'Strong arm, projects to throw 90+ in college. Good work ethic observed during camp. Family is supportive of baseball career.', createdAt: '2024-11-10', coachName: 'Coach Williams', isPinned: true, category: 'evaluation' },
  { id: 'n2', content: 'Academic standing is good - 3.5 GPA. Taking AP classes. Interested in Business major.', createdAt: '2024-11-08', coachName: 'Coach Davis', category: 'academic' },
  { id: 'n3', content: 'Great character kid. Team captain. Very coachable and takes feedback well.', createdAt: '2024-10-25', coachName: 'Coach Williams', category: 'character' },
  { id: 'n4', content: 'Visited campus 10/5. Very impressed with facilities. Asked good questions about player development program.', createdAt: '2024-10-05', coachName: 'Coach Williams', category: 'visit' },
];

const MOCK_STATS: PlayerStats = {
  hitting: {
    avg: '.385',
    obp: '.465',
    slg: '.615',
    ops: '1.080',
    hr: 8,
    rbi: 42,
    sb: 15,
    games: 35,
  },
  pitching: {
    era: '2.15',
    whip: '0.98',
    kPer9: '11.2',
    wins: 7,
    saves: 2,
    ip: '68.1',
    so: 86,
    games: 12,
  },
  fielding: {
    fieldingPct: '.975',
    putouts: 145,
    assists: 28,
    errors: 4,
    doublePlays: 12,
    games: 35,
  },
};

const MOCK_VIDEOS: PlayerVideo[] = [
  { id: 'v1', title: 'Summer Showcase Highlights', video_type: 'Highlights', video_url: '#', thumbnail_url: '', duration: '3:24', recorded_date: '2024-08-15', views: 1250 },
  { id: 'v2', title: 'Varsity Game vs Central High', video_type: 'Game', video_url: '#', thumbnail_url: '', duration: '8:45', recorded_date: '2024-09-20', views: 856 },
  { id: 'v3', title: 'Pitching Mechanics Training', video_type: 'Training', video_url: '#', thumbnail_url: '', duration: '5:12', recorded_date: '2024-10-05', views: 432 },
  { id: 'v4', title: 'PG Showcase Pitching', video_type: 'Highlights', video_url: '#', thumbnail_url: '', duration: '2:58', recorded_date: '2024-07-22', views: 2100 },
  { id: 'v5', title: 'Fall League At-Bats', video_type: 'Game', video_url: '#', thumbnail_url: '', duration: '6:30', recorded_date: '2024-10-18', views: 645 },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ContactTypeBadge({ type }: { type: ContactHistory['type'] }) {
  const configs: Record<ContactHistory['type'], { bg: string; text: string; icon: React.ElementType }> = {
    email: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Mail },
    call: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Phone },
    text: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: MessageSquare },
    visit: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: MapPin },
    camp: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: Users },
    other: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Activity },
  };
  const config = configs[type];
  const Icon = config.icon;
  return (
    <Badge className={`${config.bg} ${config.text} capitalize text-[10px]`}>
      <Icon className="w-3 h-3 mr-1" />
      {type}
    </Badge>
  );
}

function NoteCategoryBadge({ category }: { category?: RecruitmentNote['category'] }) {
  if (!category) return null;
  const configs: Record<string, { bg: string; text: string }> = {
    general: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    evaluation: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    visit: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    academic: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    character: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  };
  const config = configs[category];
  return (
    <Badge className={`${config.bg} ${config.text} capitalize text-[10px]`}>
      {category}
    </Badge>
  );
}

function StatCard({ 
  label, 
  value, 
  trend, 
  comparison,
  isDark 
}: { 
  label: string; 
  value: string | number; 
  trend?: 'up' | 'down' | 'neutral';
  comparison?: string;
  isDark: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {value}
        </p>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {comparison}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CoachPlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const playerId = params.id as string;
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [videos, setVideos] = useState<PlayerVideo[]>(MOCK_VIDEOS);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>(MOCK_CONTACT_HISTORY);
  const [notes, setNotes] = useState<RecruitmentNote[]>(MOCK_NOTES);
  const [stats] = useState<PlayerStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [evaluationStatus, setEvaluationStatus] = useState<'not_evaluated' | 'evaluating' | 'evaluated'>('not_evaluated');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<RecruitmentNote['category']>('general');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    loadPlayerData();
    checkWatchlist();
  }, [playerId]);

  const loadPlayerData = async () => {
    const supabase = createClient();
    
    // Load player
    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerData) {
      setPlayer(playerData);
    }

    // Load metrics
    const { data: metricsData } = await supabase
      .from('player_metrics')
      .select('*')
      .eq('player_id', playerId)
      .order('updated_at', { ascending: false });

    if (metricsData) {
      setMetrics(metricsData);
    }

    // Load achievements
    const { data: achievementsData } = await supabase
      .from('player_achievements')
      .select('*')
      .eq('player_id', playerId)
      .order('achievement_date', { ascending: false });

    if (achievementsData) {
      setAchievements(achievementsData);
    }

    setLoading(false);
  };

  const checkWatchlist = async () => {
    const supabase = createClient();
    
    let coachId = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) return;
      coachId = coachData.id;
    }

    const { data } = await supabase
      .from('recruits')
      .select('id')
      .eq('coach_id', coachId)
      .eq('player_id', playerId)
      .maybeSingle();

    setInWatchlist(!!data);
  };

  const handleAddToWatchlist = async () => {
    const supabase = createClient();
    
    let coachId = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) return;
      coachId = coachData.id;
    }

    if (inWatchlist) {
      // Remove from watchlist
      const { error } = await supabase
        .from('recruits')
        .delete()
        .eq('coach_id', coachId)
        .eq('player_id', playerId);

      if (error) {
        toast.error('Failed to remove from watchlist');
      } else {
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      }
    } else {
      // Add to watchlist
      const { error } = await supabase
        .from('recruits')
        .upsert({
          coach_id: coachId,
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
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: RecruitmentNote = {
      id: `n${Date.now()}`,
      content: newNote,
      createdAt: new Date().toISOString(),
      coachName: 'You',
      category: noteCategory,
    };
    
    setNotes([note, ...notes]);
    setNewNote('');
    toast.success('Note added');
  };

  const handlePinNote = (noteId: string) => {
    setNotes(notes.map(n => 
      n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
    toast.success('Note deleted');
  };

  const handleScheduleVisit = () => {
    setShowScheduleModal(false);
    toast.success('Visit scheduled! Calendar invite sent.');
  };

  const handleSendMessage = () => {
    setShowMessageModal(false);
    toast.success('Message sent to player!');
  };

  // Sorted notes - pinned first
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[50vh] ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className={`max-w-7xl mx-auto px-6 py-8 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
          <CardContent className="py-20 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Player not found</p>
            <Link href="/coach/discover">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discover
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();
  const initials = `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase();
  const height = player.height_feet && player.height_inches !== null
    ? `${player.height_feet}'${player.height_inches}"`
    : null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 to-emerald-50/20'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className={isDark ? 'text-slate-400 hover:text-white' : ''}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className={isDark ? 'border-slate-600' : ''}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" className={isDark ? 'border-slate-600' : ''}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Player Header Card */}
        <Card className={`mb-6 overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className={`h-24 bg-gradient-to-r ${isDark ? 'from-emerald-600/30 to-blue-600/30' : 'from-emerald-500/20 to-blue-500/20'}`} />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col lg:flex-row gap-6 -mt-12">
              {/* Avatar */}
              <Avatar className={`w-28 h-28 border-4 ${isDark ? 'border-slate-800' : 'border-white'} shadow-xl`}>
                <AvatarImage src={player.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 pt-4 lg:pt-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {fullName}
                      </h1>
                      {inWatchlist && (
                        <Badge className="bg-amber-500/20 text-amber-400">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Watchlist
                        </Badge>
                      )}
                      {evaluationStatus === 'evaluated' && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Evaluated
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm">
                      {player.grad_year && (
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <GraduationCap className="w-4 h-4 text-blue-400" />
                          Class of {player.grad_year}
                        </span>
                      )}
                      {player.primary_position && (
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Target className="w-4 h-4 text-emerald-400" />
                          {player.primary_position}
                          {player.secondary_position && ` / ${player.secondary_position}`}
                        </span>
                      )}
                      {height && (
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Ruler className="w-4 h-4 text-purple-400" />
                          {height}
                          {player.weight_lbs && ` • ${player.weight_lbs} lbs`}
                        </span>
                      )}
                      {player.throws && player.bats && (
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Activity className="w-4 h-4 text-amber-400" />
                          {player.throws}/{player.bats}
                        </span>
                      )}
                    </div>

                    {player.high_school_name && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <MapPin className="w-4 h-4" />
                        {player.high_school_name}
                        {player.high_school_city && player.high_school_state && (
                          <span> • {player.high_school_city}, {player.high_school_state}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={inWatchlist ? 'outline' : 'default'}
                      onClick={handleAddToWatchlist}
                      className={`gap-2 ${inWatchlist ? (isDark ? 'border-amber-500/50 text-amber-400' : 'border-amber-500 text-amber-600') : 'bg-emerald-500 hover:bg-emerald-600'}`}
                    >
                      <Star className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
                      {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowMessageModal(true)}
                      className={`gap-2 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowScheduleModal(true)}
                      className={`gap-2 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Schedule Visit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                  <Activity className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.hitting.avg}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Batting Avg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                  <Zap className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.pitching.era}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ERA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                  <Video className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{videos.length}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                  <MessageSquare className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{contactHistory.length}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`${isDark ? 'bg-slate-800/60' : 'bg-slate-100'} p-1`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="contacts">Contact History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Measurables */}
              <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Ruler className="w-5 h-5 text-blue-400" />
                    Measurables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {metrics.length > 0 ? (
                      metrics.slice(0, 6).map((metric) => (
                        <div key={metric.id} className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.metric_label}</p>
                          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{metric.metric_value}</p>
                          {metric.verified_date && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Verified</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-2 text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Ruler className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No measurables recorded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Clock className="w-5 h-5 text-amber-400" />
                    Recent Contact History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contactHistory.slice(0, 4).map((contact) => (
                      <div key={contact.id} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                        <ContactTypeBadge type={contact.type} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {contact.description}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(contact.date).toLocaleDateString()} • {contact.coachName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    className={`w-full mt-3 ${isDark ? 'text-slate-400 hover:text-white' : ''}`}
                    onClick={() => setActiveTab('contacts')}
                  >
                    View All Contacts
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              {/* Pinned Notes */}
              <Card className={`lg:col-span-2 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Pin className="w-5 h-5 text-purple-400" />
                    Pinned Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {sortedNotes.filter(n => n.isPinned).length > 0 ? (
                      sortedNotes.filter(n => n.isPinned).map((note) => (
                        <div key={note.id} className={`p-4 rounded-xl border ${isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <NoteCategoryBadge category={note.category} />
                            <Pin className="w-4 h-4 text-purple-400 fill-current" />
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{note.content}</p>
                          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {note.coachName} • {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-2 text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Pin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No pinned notes yet</p>
                        <Button 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => setActiveTab('notes')}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Note
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Hitting Stats */}
              <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Hitting Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="AVG" value={stats.hitting.avg} trend="up" comparison="+.025" isDark={isDark} />
                    <StatCard label="OBP" value={stats.hitting.obp} trend="up" comparison="+.015" isDark={isDark} />
                    <StatCard label="SLG" value={stats.hitting.slg} trend="up" comparison="+.040" isDark={isDark} />
                    <StatCard label="OPS" value={stats.hitting.ops} trend="up" comparison="+.055" isDark={isDark} />
                    <StatCard label="HR" value={stats.hitting.hr} isDark={isDark} />
                    <StatCard label="RBI" value={stats.hitting.rbi} isDark={isDark} />
                    <StatCard label="SB" value={stats.hitting.sb} isDark={isDark} />
                    <StatCard label="Games" value={stats.hitting.games} isDark={isDark} />
                  </div>
                </CardContent>
              </Card>

              {/* Pitching Stats */}
              <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Zap className="w-5 h-5 text-blue-400" />
                    Pitching Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="ERA" value={stats.pitching.era} trend="down" comparison="-0.32" isDark={isDark} />
                    <StatCard label="WHIP" value={stats.pitching.whip} trend="down" comparison="-0.08" isDark={isDark} />
                    <StatCard label="K/9" value={stats.pitching.kPer9} trend="up" comparison="+0.8" isDark={isDark} />
                    <StatCard label="IP" value={stats.pitching.ip} isDark={isDark} />
                    <StatCard label="W" value={stats.pitching.wins} isDark={isDark} />
                    <StatCard label="SV" value={stats.pitching.saves} isDark={isDark} />
                    <StatCard label="SO" value={stats.pitching.so} isDark={isDark} />
                    <StatCard label="Games" value={stats.pitching.games} isDark={isDark} />
                  </div>
                </CardContent>
              </Card>

              {/* Fielding Stats */}
              <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Target className="w-5 h-5 text-purple-400" />
                    Fielding Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="FLD%" value={stats.fielding.fieldingPct} isDark={isDark} />
                    <StatCard label="PO" value={stats.fielding.putouts} isDark={isDark} />
                    <StatCard label="A" value={stats.fielding.assists} isDark={isDark} />
                    <StatCard label="E" value={stats.fielding.errors} trend="down" comparison="-2" isDark={isDark} />
                    <StatCard label="DP" value={stats.fielding.doublePlays} isDark={isDark} />
                    <StatCard label="Games" value={stats.fielding.games} isDark={isDark} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Video className="w-5 h-5 text-rose-400" />
                    Video Highlights
                  </CardTitle>
                  <div className="flex gap-2">
                    {['All', 'Highlights', 'Game', 'Training'].map(filter => (
                      <Badge 
                        key={filter} 
                        variant="outline" 
                        className={`cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                      >
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <div 
                      key={video.id} 
                      className={`rounded-xl overflow-hidden border cursor-pointer group ${isDark ? 'bg-slate-700/30 border-slate-700/50 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`aspect-video ${isDark ? 'bg-slate-800' : 'bg-slate-200'} flex items-center justify-center relative`}>
                        <Play className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-400'} group-hover:text-emerald-500 transition-colors`} />
                        {video.duration && (
                          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px]">
                            {video.duration}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {video.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">{video.video_type}</Badge>
                              {video.recorded_date && (
                                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {new Date(video.recorded_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {video.views && (
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Eye className="w-3 h-3 inline mr-1" />
                              {video.views.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact History Tab */}
          <TabsContent value="contacts">
            <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Clock className="w-5 h-5 text-amber-400" />
                    Contact History
                  </CardTitle>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Log Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  
                  <div className="space-y-4">
                    {contactHistory.map((contact, index) => (
                      <div key={contact.id} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                          contact.type === 'visit' ? 'bg-amber-500' :
                          contact.type === 'call' ? 'bg-emerald-500' :
                          contact.type === 'email' ? 'bg-blue-500' :
                          'bg-slate-500'
                        } ring-4 ring-opacity-20 ${
                          contact.type === 'visit' ? 'ring-amber-500' :
                          contact.type === 'call' ? 'ring-emerald-500' :
                          contact.type === 'email' ? 'ring-blue-500' :
                          'ring-slate-500'
                        }`} />
                        
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <ContactTypeBadge type={contact.type} />
                                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {new Date(contact.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {contact.description}
                              </p>
                              {contact.outcome && (
                                <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <strong>Outcome:</strong> {contact.outcome}
                                </p>
                              )}
                              <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                — {contact.coachName}
                              </p>
                            </div>
                            {contact.followUp && new Date(contact.followUp) >= new Date() && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-[10px] shrink-0">
                                <Calendar className="w-3 h-3 mr-1" />
                                Follow up {new Date(contact.followUp).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <FileText className="w-5 h-5 text-purple-400" />
                  Recruitment Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Note Form */}
                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                  <textarea
                    placeholder="Add a note about this player..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className={`w-full h-24 px-4 py-3 rounded-lg border resize-none ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category:</span>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value as RecruitmentNote['category'])}
                        className={`text-sm px-2 py-1 rounded border ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="general">General</option>
                        <option value="evaluation">Evaluation</option>
                        <option value="visit">Visit</option>
                        <option value="academic">Academic</option>
                        <option value="character">Character</option>
                      </select>
                    </div>
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {sortedNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-xl border ${
                        note.isPinned
                          ? isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                          : isDark ? 'bg-slate-700/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <NoteCategoryBadge category={note.category} />
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            {note.isPinned && (
                              <Pin className="w-3 h-3 text-purple-400 fill-current" />
                            )}
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {note.content}
                          </p>
                          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            — {note.coachName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePinNote(note.id)}
                            className={`h-8 w-8 p-0 ${note.isPinned ? 'text-purple-400' : ''}`}
                          >
                            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic">
            <Card className={isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <School className="w-5 h-5 text-blue-400" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ACADEMIC STANDING
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>GPA</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>3.5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>SAT Score</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>1180</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>ACT Score</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>25</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Class Rank</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Top 20%</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      INTERESTS & GOALS
                    </p>
                    <div className="space-y-3">
                      <div>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Intended Major</span>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Business Administration</p>
                      </div>
                      <div>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>NCAA Eligibility</span>
                        <Badge className="ml-2 bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Cleared
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dream Schools */}
                {player.top_schools && player.top_schools.length > 0 && (
                  <div className="mt-6">
                    <p className={`text-xs font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      DREAM SCHOOLS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {player.top_schools.map((school, i) => (
                        <Badge key={i} variant="outline" className={isDark ? 'border-slate-600' : ''}>
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {school}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Visit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className={`w-full max-w-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={isDark ? 'text-white' : 'text-slate-800'}>Schedule Visit</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Visit Type</label>
                <select className={`w-full mt-1 p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
                  <option>Official Visit</option>
                  <option>Unofficial Visit</option>
                  <option>Junior Day</option>
                  <option>Camp</option>
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Date</label>
                <Input type="date" className={`mt-1 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : ''}`} />
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Notes</label>
                <textarea 
                  className={`w-full mt-1 p-2 rounded-lg border h-20 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  placeholder="Add any notes about this visit..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={handleScheduleVisit}>
                  <CalendarPlus className="w-4 h-4 mr-1" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className={`w-full max-w-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={isDark ? 'text-white' : 'text-slate-800'}>Send Message</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowMessageModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Subject</label>
                <Input 
                  placeholder="Message subject..." 
                  className={`mt-1 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Message</label>
                <textarea 
                  className={`w-full mt-1 p-3 rounded-lg border h-32 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  placeholder="Type your message..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={handleSendMessage}>
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
