'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Star,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Trophy,
  Target,
  TrendingUp,
  AlertTriangle,
  Bell,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  Award,
  Users,
  Building2,
  FileText,
  DollarSign,
  Sparkles,
  Zap,
  Timer,
  Flag,
  Check,
  X,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { GlassProgressBar, CircularProgress } from '@/components/ui/GlassProgressBar';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming' | 'overdue';
type InteractionType = 'email' | 'call' | 'visit' | 'camp' | 'showcase' | 'offer' | 'meeting';
type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'considering';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  category: 'academic' | 'athletic' | 'recruiting' | 'administrative';
  priority: 'high' | 'medium' | 'low';
}

interface CollegeInteraction {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeLogo?: string;
  division: string;
  type: InteractionType;
  date: string;
  description: string;
  contactName?: string;
  contactRole?: string;
  notes?: string;
  followUpDate?: string;
}

interface Offer {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeLogo?: string;
  division: string;
  location: string;
  conference: string;
  status: OfferStatus;
  scholarshipType: 'full' | 'partial' | 'walk-on' | 'preferred_walk_on';
  scholarshipPercentage?: number;
  offerDate: string;
  deadline?: string;
  daysUntilDeadline?: number;
  coachName?: string;
  coachEmail?: string;
  notes?: string;
  pros?: string[];
  cons?: string[];
}

interface TimelineEvent {
  id: string;
  type: 'milestone' | 'interaction' | 'offer' | 'deadline';
  date: string;
  title: string;
  description: string;
  collegeName?: string;
  status?: string;
  icon: React.ElementType;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA FETCHING (Replacing Mock Data)
// ═══════════════════════════════════════════════════════════════════════════

// Mock data removed - now using real Supabase queries in component

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const configs: Record<MilestoneStatus, { bg: string; text: string; icon: React.ElementType }> = {
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
    upcoming: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Circle },
    overdue: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
  };
  const config = configs[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.bg} ${config.text} capitalize text-[10px]`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  );
}

function InteractionTypeBadge({ type }: { type: InteractionType }) {
  const configs: Record<InteractionType, { bg: string; text: string; icon: React.ElementType }> = {
    email: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Mail },
    call: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Phone },
    visit: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: MapPin },
    camp: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Trophy },
    showcase: { bg: 'bg-pink-500/20', text: 'text-pink-400', icon: Star },
    offer: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: Award },
    meeting: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', icon: Users },
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

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const configs: Record<OfferStatus, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    accepted: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    declined: { bg: 'bg-red-500/20', text: 'text-red-400' },
    expired: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    considering: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  };
  const config = configs[status];
  return (
    <Badge className={`${config.bg} ${config.text} capitalize text-[10px]`}>
      {status}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerJourneyPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'timeline' | 'milestones' | 'interactions' | 'offers' | 'decisions'>('timeline');
  const [filterCollege, setFilterCollege] = useState<string>('');
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  // Data state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [interactions, setInteractions] = useState<CollegeInteraction[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deadlines, setDeadlines] = useState<Array<{
    id: string;
    title: string;
    date: string;
    daysUntil: number;
    type: string;
    urgent: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadJourneyData();
  }, []);

  const loadJourneyData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast.error('Please sign in to view your recruiting journey');
        return;
      }
      setUserId(user.id);

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('recruiting_milestones')
        .select(`
          *,
          college:colleges(name, logo_url)
        `)
        .eq('player_id', user.id)
        .order('milestone_date', { ascending: false });

      if (milestonesError) throw milestonesError;

      // Transform to match interface
      const transformedMilestones: Milestone[] = (milestonesData || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        targetDate: m.milestone_date,
        completedDate: m.completed_date,
        status: m.status as MilestoneStatus,
        category: m.category as any,
        priority: m.priority as any,
      }));
      setMilestones(transformedMilestones);

      // Load interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('college_interactions')
        .select(`
          *,
          college:colleges(name, logo_url, city, state)
        `)
        .eq('player_id', user.id)
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (interactionsError) throw interactionsError;

      const transformedInteractions: CollegeInteraction[] = (interactionsData || []).map(i => ({
        id: i.id,
        collegeId: i.college_id,
        collegeName: i.college?.name || 'Unknown College',
        collegeLogo: i.college?.logo_url,
        division: 'D1', // TODO: Add division to colleges table
        type: i.interaction_type as InteractionType,
        date: new Date(i.interaction_date).toISOString().split('T')[0],
        description: i.description || i.subject || '',
        contactName: i.contact_name,
        contactRole: i.contact_role,
        notes: i.notes,
        followUpDate: i.follow_up_date,
      }));
      setInteractions(transformedInteractions);

      // Load offers
      const { data: offersData, error: offersError } = await supabase
        .from('scholarship_offers')
        .select(`
          *,
          college:colleges(name, logo_url, city, state, division)
        `)
        .eq('player_id', user.id)
        .order('offer_date', { ascending: false });

      if (offersError) throw offersError;

      const transformedOffers: Offer[] = (offersData || []).map(o => ({
        id: o.id,
        collegeId: o.college_id,
        collegeName: o.college?.name || 'Unknown College',
        collegeLogo: o.college?.logo_url,
        division: o.college?.division || o.division || 'D1',
        location: o.location || `${o.college?.city}, ${o.college?.state}`,
        conference: o.conference || '',
        status: o.status as OfferStatus,
        scholarshipType: o.offer_type.toLowerCase().includes('full') ? 'full' : 'partial',
        scholarshipPercentage: o.scholarship_percentage || 0,
        offerDate: o.offer_date,
        deadline: o.decision_deadline,
        daysUntilDeadline: o.days_until_deadline || 0,
        coachName: o.coach_name,
        coachEmail: o.coach_email,
        coachPhone: o.coach_phone,
        notes: o.notes,
        pros: Array.isArray(o.pros) ? o.pros : [],
        cons: Array.isArray(o.cons) ? o.cons : [],
      }));
      setOffers(transformedOffers);

      // Load deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from('recruiting_deadlines')
        .select('*')
        .eq('player_id', user.id)
        .eq('completed', false)
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .order('deadline_date', { ascending: true })
        .limit(20);

      if (deadlinesError) throw deadlinesError;

      const transformedDeadlines = (deadlinesData || []).map(d => ({
        id: d.id,
        title: d.title,
        date: d.deadline_date,
        daysUntil: d.days_until || 0,
        type: d.deadline_type,
        urgent: d.urgent || false,
      }));
      setDeadlines(transformedDeadlines);

    } catch (error) {
      console.error('Error loading journey data:', error);
      toast.error('Failed to load recruiting journey data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.length;
    const activeOffers = offers.filter(o => ['pending', 'considering'].includes(o.status)).length;
    const totalInteractions = interactions.length;
    const urgentDeadlines = deadlines.filter(d => d.urgent && d.daysUntil > 0).length;

    return {
      completedMilestones,
      totalMilestones,
      milestoneProgress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      activeOffers,
      totalInteractions,
      urgentDeadlines,
    };
  }, [milestones, offers, interactions, deadlines]);

  // Generate unified timeline
  const timeline = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add milestones
    milestones.forEach(m => {
      events.push({
        id: `m-${m.id}`,
        type: 'milestone',
        date: m.completedDate || m.targetDate,
        title: m.title,
        description: m.description,
        status: m.status,
        icon: m.status === 'completed' ? CheckCircle2 : m.status === 'in_progress' ? Clock : Target,
        color: m.status === 'completed' ? 'emerald' : m.status === 'in_progress' ? 'blue' : 'slate',
      });
    });

    // Add interactions
    interactions.forEach(i => {
      events.push({
        id: `i-${i.id}`,
        type: 'interaction',
        date: i.date,
        title: `${i.type.charAt(0).toUpperCase() + i.type.slice(1)} - ${i.collegeName}`,
        description: i.description,
        collegeName: i.collegeName,
        icon: i.type === 'offer' ? Award : i.type === 'visit' ? MapPin : i.type === 'camp' ? Trophy : Mail,
        color: i.type === 'offer' ? 'cyan' : i.type === 'visit' ? 'purple' : 'blue',
      });
    });

    // Sort by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [milestones, interactions]);

  // Get unique colleges for filter
  const colleges = useMemo(() => {
    const collegeSet = new Set(interactions.map(i => i.collegeName));
    return Array.from(collegeSet);
  }, [interactions]);

  // Filter interactions by college
  const filteredInteractions = useMemo(() => {
    if (!filterCollege) return interactions;
    return interactions.filter(i => i.collegeName === filterCollege);
  }, [filterCollege, interactions]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-500' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-500' },
      slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
    };
    return colors[color] || colors.slate;
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen pb-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 to-emerald-50/20'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 to-emerald-50/20'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                My Recruiting Journey
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Track your path to playing college baseball
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.urgentDeadlines > 0 && (
                <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                  <Bell className="w-3 h-3 mr-1" />
                  {stats.urgentDeadlines} Urgent
                </Badge>
              )}
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Activity
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {stats.milestoneProgress}%
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Journey Progress
                  </p>
                </div>
                <CircularProgress value={stats.milestoneProgress} size={48} strokeWidth={4} />
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}`}>
                  <Award className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.activeOffers}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                  <MessageSquare className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.totalInteractions}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {stats.completedMilestones}/{stats.totalMilestones}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Milestones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deadline Reminders */}
        {deadlines.filter(d => d.daysUntil > 0).length > 0 && (
          <Card className={`overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-amber-500/10 to-red-500/10 border-amber-500/30' 
              : 'bg-gradient-to-r from-amber-50 to-red-50 border-amber-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {deadlines.filter(d => d.daysUntil > 0).map(deadline => (
                  <div 
                    key={deadline.id}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                      deadline.urgent
                        ? isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-100 border border-red-200'
                        : isDark ? 'bg-slate-800/50' : 'bg-white/80'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {deadline.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(deadline.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${
                      deadline.urgent 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    } text-[10px]`}>
                      <Timer className="w-3 h-3 mr-1" />
                      {deadline.daysUntil}d
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl overflow-x-auto ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
          {(['timeline', 'milestones', 'interactions', 'offers', 'decisions'] as const).map(tab => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              aria-label={`View ${tab} tab`}
              aria-pressed={activeTab === tab}
              className={`flex-shrink-0 capitalize ${
                activeTab === tab
                  ? isDark 
                    ? 'bg-slate-700 text-white' 
                    : 'bg-white text-slate-800 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'timeline' && <Clock className="w-4 h-4 mr-2" />}
              {tab === 'milestones' && <Target className="w-4 h-4 mr-2" />}
              {tab === 'interactions' && <MessageSquare className="w-4 h-4 mr-2" />}
              {tab === 'offers' && <Award className="w-4 h-4 mr-2" />}
              {tab === 'decisions' && <Flag className="w-4 h-4 mr-2" />}
              {tab}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                
                <div className="space-y-6">
                  {timeline.slice(0, 10).map((event, index) => {
                    const colors = getColorClasses(event.color);
                    const Icon = event.icon;
                    return (
                      <div key={event.id} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-opacity-20 ${
                          event.color === 'emerald' ? 'ring-emerald-500' :
                          event.color === 'blue' ? 'ring-blue-500' :
                          event.color === 'purple' ? 'ring-purple-500' :
                          event.color === 'cyan' ? 'ring-cyan-500' :
                          'ring-slate-500'
                        }`} />
                        
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <Icon className={`w-4 h-4 ${colors.text}`} />
                              </div>
                              <div>
                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {event.title}
                                </p>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {event.description}
                                </p>
                                {event.collegeName && (
                                  <Badge variant="outline" className="mt-2 text-[10px]">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    {event.collegeName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              {event.status && <MilestoneStatusBadge status={event.status as MilestoneStatus} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'milestones' && (
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Recruiting Milestones
                </CardTitle>
                <Button size="sm" variant="outline" className={isDark ? 'border-slate-600' : ''}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['academic', 'athletic', 'recruiting', 'administrative'].map(category => {
                  const categoryMilestones = milestones.filter(m => m.category === category);
                  if (categoryMilestones.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <div className={`flex items-center gap-2 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {category === 'academic' && <GraduationCap className="w-4 h-4" />}
                        {category === 'athletic' && <Trophy className="w-4 h-4" />}
                        {category === 'recruiting' && <Users className="w-4 h-4" />}
                        {category === 'administrative' && <FileText className="w-4 h-4" />}
                        <span className="text-xs font-medium uppercase tracking-wide capitalize">{category}</span>
                      </div>
                      <div className="space-y-2">
                        {categoryMilestones.map(milestone => (
                          <div
                            key={milestone.id}
                            className={`flex items-start gap-3 p-4 rounded-xl ${
                              milestone.status === 'completed'
                                ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                                : milestone.status === 'overdue'
                                ? isDark ? 'bg-red-500/10' : 'bg-red-50'
                                : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                            }`}
                          >
                            <div className={`mt-0.5 ${
                              milestone.status === 'completed' ? 'text-emerald-500' : 
                              milestone.status === 'in_progress' ? 'text-blue-500' :
                              milestone.status === 'overdue' ? 'text-red-500' :
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {milestone.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : milestone.status === 'in_progress' ? (
                                <Clock className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={`font-medium text-sm ${
                                    milestone.status === 'completed'
                                      ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                                      : isDark ? 'text-white' : 'text-slate-800'
                                  }`}>
                                    {milestone.title}
                                  </p>
                                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {milestone.description}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <MilestoneStatusBadge status={milestone.status} />
                                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {milestone.completedDate 
                                      ? `Completed ${new Date(milestone.completedDate).toLocaleDateString()}`
                                      : `Due ${new Date(milestone.targetDate).toLocaleDateString()}`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'interactions' && (
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  College Interaction History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={filterCollege}
                    onChange={(e) => setFilterCollege(e.target.value)}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="">All Colleges</option>
                    {colleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Log Interaction
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInteractions.map(interaction => (
                  <div
                    key={interaction.id}
                    className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={interaction.collegeLogo} />
                          <AvatarFallback className={`text-xs font-medium ${isDark ? 'bg-slate-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                            {interaction.collegeName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {interaction.collegeName}
                            </p>
                            <Badge variant="outline" className="text-[10px]">{interaction.division}</Badge>
                            <InteractionTypeBadge type={interaction.type} />
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {interaction.description}
                          </p>
                          {interaction.contactName && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Contact: {interaction.contactName} {interaction.contactRole && `(${interaction.contactRole})`}
                            </p>
                          )}
                          {interaction.notes && (
                            <p className={`text-xs mt-2 italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              &ldquo;{interaction.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {new Date(interaction.date).toLocaleDateString()}
                        </p>
                        {interaction.followUpDate && (
                          <Badge className="mt-1 bg-amber-500/20 text-amber-400 text-[10px]">
                            <Bell className="w-3 h-3 mr-1" />
                            Follow up {new Date(interaction.followUpDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            {offers.map(offer => (
              <Card 
                key={offer.id}
                className={`overflow-hidden ${
                  offer.status === 'accepted'
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                    : isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'
                }`}
              >
                <CardContent className="p-0">
                  <div 
                    className={`p-4 cursor-pointer ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}
                    onClick={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={offer.collegeLogo} />
                          <AvatarFallback className={`text-lg font-bold ${isDark ? 'bg-slate-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                            {offer.collegeName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {offer.collegeName}
                            </h3>
                            <Badge variant="outline" className="text-[10px]">{offer.division}</Badge>
                            <OfferStatusBadge status={offer.status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {offer.location}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {offer.conference}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${
                              offer.scholarshipType === 'full' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : offer.scholarshipType === 'partial'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-slate-500/20 text-slate-400'
                            } text-[10px]`}>
                              <DollarSign className="w-3 h-3 mr-1" />
                              {offer.scholarshipPercentage ? `${offer.scholarshipPercentage}%` : offer.scholarshipType.replace('_', ' ')}
                            </Badge>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Offered {new Date(offer.offerDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {offer.deadline && offer.daysUntilDeadline && offer.daysUntilDeadline > 0 && (
                          <Badge className={`${
                            offer.daysUntilDeadline <= 7 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-amber-500/20 text-amber-400'
                          } mb-2`}>
                            <Timer className="w-3 h-3 mr-1" />
                            {offer.daysUntilDeadline}d left
                          </Badge>
                        )}
                        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'} transition-transform ${
                          expandedOffer === offer.id ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedOffer === offer.id && (
                    <div className={`px-4 pb-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <div className="pt-4 grid md:grid-cols-2 gap-4">
                        {/* Pros & Cons */}
                        <div>
                          <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            PROS
                          </p>
                          <div className="space-y-1">
                            {offer.pros?.map((pro, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{pro}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            CONS
                          </p>
                          <div className="space-y-1">
                            {offer.cons?.map((con, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <X className="w-4 h-4 text-red-400" />
                                <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{con}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {offer.notes && (
                        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Notes
                          </p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{offer.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed ${isDark ? 'border-slate-700/50' : 'border-slate-200'}">
                        <div className="flex items-center gap-2">
                          {offer.coachEmail && (
                            <Button variant="outline" size="sm" className={isDark ? 'border-slate-600' : ''}>
                              <Mail className="w-4 h-4 mr-1" />
                              Contact Coach
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className={isDark ? 'border-slate-600' : ''}>
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        {['pending', 'considering'].includes(offer.status) && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                              <Check className="w-4 h-4 mr-1" />
                              Accept Offer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="space-y-6">
            {/* Decision Matrix */}
            <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Decision Comparison Tool
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <th className={`text-left py-3 px-4 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Factor
                        </th>
                        {offers.filter(o => ['pending', 'considering'].includes(o.status)).map(offer => (
                          <th key={offer.id} className={`text-center py-3 px-4 text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {offer.collegeName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Scholarship', key: 'scholarship' },
                        { label: 'Division', key: 'division' },
                        { label: 'Conference', key: 'conference' },
                        { label: 'Location', key: 'location' },
                        { label: 'Deadline', key: 'deadline' },
                      ].map(factor => (
                        <tr key={factor.key} className={`border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                          <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {factor.label}
                          </td>
                          {offers.filter(o => ['pending', 'considering'].includes(o.status)).map(offer => (
                            <td key={offer.id} className={`text-center py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {factor.key === 'scholarship' && (
                                <Badge className={`${
                                  (offer.scholarshipPercentage || 0) >= 75 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {offer.scholarshipPercentage}%
                                </Badge>
                              )}
                              {factor.key === 'division' && offer.division}
                              {factor.key === 'conference' && offer.conference}
                              {factor.key === 'location' && offer.location}
                              {factor.key === 'deadline' && offer.deadline && (
                                <Badge className={`${
                                  (offer.daysUntilDeadline || 0) <= 7 
                                    ? 'bg-red-500/20 text-red-400' 
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {offer.daysUntilDeadline}d
                                </Badge>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Decision Checklist */}
            <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Decision Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 'dc1', label: 'Discussed options with family', completed: true },
                    { id: 'dc2', label: 'Visited all top-choice campuses', completed: true },
                    { id: 'dc3', label: 'Compared financial aid packages', completed: false },
                    { id: 'dc4', label: 'Spoken with current players on the team', completed: false },
                    { id: 'dc5', label: 'Reviewed academic programs', completed: true },
                    { id: 'dc6', label: 'Considered distance from home', completed: true },
                    { id: 'dc7', label: 'Evaluated coaching staff stability', completed: false },
                  ].map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        item.completed
                          ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                          : isDark ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`${item.completed ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        item.completed 
                          ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                          : isDark ? 'text-white' : 'text-slate-800'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className={`overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30' 
                : 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <Zap className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Ready to Decide?
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      You have {offers.filter(o => ['pending', 'considering'].includes(o.status)).length} active offers to consider.
                      {offers.filter(o => o.daysUntilDeadline && o.daysUntilDeadline > 0).length > 0 &&
                        ` Your next deadline is in ${Math.min(...offers.filter(o => o.daysUntilDeadline && o.daysUntilDeadline > 0).map(o => o.daysUntilDeadline!))} days.`}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <Button className="bg-emerald-500 hover:bg-emerald-600">
                        <Check className="w-4 h-4 mr-2" />
                        Make Decision
                      </Button>
                      <Button variant="outline" className={isDark ? 'border-slate-600 text-white' : ''}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Family Meeting
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
