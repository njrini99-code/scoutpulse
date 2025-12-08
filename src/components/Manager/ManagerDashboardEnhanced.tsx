import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Trophy,
  X,
  ChevronDown,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  MapPin,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Zap,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Team {
  id: string;
  team_code: string;
  team_name: string;
  manager_id: string;
  created_at: string;
}

interface RepMetrics {
  rep_id: string;
  rep_name: string;
  rep_email: string;
  np_count: number;
  osv_count: number;
  pipeline_value: number;
  closed_deals: number;
  close_ratio: number;
  last_activity: string;
}

interface TeamMetrics {
  active_reps: number;
  total_nps: number;
  total_osvs: number;
  total_pipeline: number;
  total_closed: number;
  avg_close_ratio: number;
}

interface RepGoals {
  awv_goal: number;
  avg_account_size: number;
  close_rate: number;
}

interface FollowUpRequest {
  id: string;
  business_name: string;
  decision_maker: string;
  decision_maker_title: string;
  phone: string;
  follow_up_notes: string;
  status: string;
  rep_name: string;
  created_at: string;
  follow_up_date: string;
}

interface DetailedRepReport {
  rep: RepMetrics;
  goals: RepGoals;
  weeklyBreakdown: {
    np_this_week: number;
    osv_this_week: number;
    closed_this_week: number;
    pipeline_this_week: number;
  };
  recentLeads: Array<{
    business_name: string;
    status: string;
    deal_value: number;
    updated_at: string;
  }>;
}

export function ManagerDashboardEnhanced() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedRep, setSelectedRep] = useState<RepMetrics | null>(null);
  const [showRepDetails, setShowRepDetails] = useState(false);
  const [detailedReport, setDetailedReport] = useState<DetailedRepReport | null>(null);

  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
    active_reps: 0,
    total_nps: 0,
    total_osvs: 0,
    total_pipeline: 0,
    total_closed: 0,
    avg_close_ratio: 0
  });

  const [repMetrics, setRepMetrics] = useState<RepMetrics[]>([]);
  const [followUpRequests, setFollowUpRequests] = useState<FollowUpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Default goals (will be overridden by actual user goals)
  const defaultGoals: RepGoals = {
    awv_goal: 150,
    avg_account_size: 5000,
    close_rate: 40
  };

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadDashboardData();
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('manager_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading teams:', error);
      return;
    }

    if (data && data.length > 0) {
      setTeams(data);
      setSelectedTeam(data[0]);
    }
    setLoading(false);
  };

  const loadDashboardData = async () => {
    if (!selectedTeam) return;

    setLoading(true);

    // Load team metrics using optimized function
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_team_metrics', { p_team_code: selectedTeam.team_code });

    if (!metricsError && metrics && metrics.length > 0) {
      setTeamMetrics(metrics[0]);
    }

    // Load rep metrics using optimized function
    const { data: reps, error: repsError } = await supabase
      .rpc('get_rep_metrics_by_team', { p_team_code: selectedTeam.team_code });

    if (!repsError && reps) {
      setRepMetrics(reps);
    }

    // Load follow-up requests (only ghosted/callback items from reps)
    await loadFollowUpRequests();

    setLoading(false);
  };

  const loadFollowUpRequests = async () => {
    if (!selectedTeam) return;

    const { data: members } = await supabase
      .from('user_settings')
      .select('user_id, full_name')
      .eq('team_code', selectedTeam.team_code);

    if (!members || members.length === 0) return;

    const userIds = members.map(m => m.user_id);

    // Get leads with follow-up notes or ghosted status
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('user_id', userIds.map(id => id.toString()))
      .not('follow_up_notes', 'is', null)
      .or('status.eq.follow_up,status.eq.contacted')
      .order('follow_up_date', { ascending: true })
      .limit(20);

    if (leads) {
      const requests: FollowUpRequest[] = leads.map(lead => {
        const member = members.find(m => m.user_id.toString() === lead.user_id);
        return {
          id: lead.id,
          business_name: lead.business_name || 'Unknown Business',
          decision_maker: lead.decision_maker || lead.owner_name || 'Unknown',
          decision_maker_title: lead.decision_maker_title || 'Manager',
          phone: lead.phone || '',
          follow_up_notes: lead.follow_up_notes || '',
          status: lead.status || 'follow_up',
          rep_name: member?.full_name || 'Unknown Rep',
          created_at: lead.created_at,
          follow_up_date: lead.follow_up_date || ''
        };
      });
      setFollowUpRequests(requests);
    }
  };

  const loadRepDetails = async (rep: RepMetrics) => {
    setSelectedRep(rep);
    setLoading(true);

    // Load rep goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', rep.rep_id)
      .single();

    const repGoals = goalsData || defaultGoals;

    // Calculate weekly breakdown (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weeklyLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', rep.rep_id.toString())
      .gte('created_at', weekAgo.toISOString());

    const weeklyBreakdown = {
      np_this_week: weeklyLeads?.filter(l => l.np_set === 'true').length || 0,
      osv_this_week: weeklyLeads?.filter(l => l.osv_completed === 'true').length || 0,
      closed_this_week: weeklyLeads?.filter(l => l.status === 'closed_won').length || 0,
      pipeline_this_week: weeklyLeads?.reduce((sum, l) =>
        sum + (l.deal_value && l.status !== 'closed_lost' ? parseFloat(l.deal_value) : 0), 0
      ) || 0
    };

    // Load recent leads
    const { data: recentLeadsData } = await supabase
      .from('leads')
      .select('business_name, status, deal_value, updated_at')
      .eq('user_id', rep.rep_id.toString())
      .order('updated_at', { ascending: false })
      .limit(10);

    setDetailedReport({
      rep,
      goals: repGoals,
      weeklyBreakdown,
      recentLeads: recentLeadsData || []
    });

    setShowRepDetails(true);
    setLoading(false);
  };

  const getPerformanceColor = (current: number, goal: number): string => {
    const ratio = (current / goal) * 100;
    if (ratio >= 110) return 'from-green-400 to-green-500';
    if (ratio >= 90) return 'from-blue-400 to-blue-500';
    if (ratio >= 70) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  const getPerformanceBadge = (current: number, goal: number) => {
    const ratio = (current / goal) * 100;
    if (ratio >= 110) return { label: 'Crushing It', color: 'bg-green-100 text-green-700', icon: '🔥' };
    if (ratio >= 90) return { label: 'On Track', color: 'bg-blue-100 text-blue-700', icon: '✨' };
    if (ratio >= 70) return { label: 'Needs Support', color: 'bg-yellow-100 text-yellow-700', icon: '⚡' };
    return { label: 'Needs Attention', color: 'bg-red-100 text-red-700', icon: '⚠️' };
  };

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const avgOSVPerRep = teamMetrics.active_reps > 0 ? Math.round(teamMetrics.total_osvs / teamMetrics.active_reps) : 0;
  const avgNPPerRep = teamMetrics.active_reps > 0 ? Math.round(teamMetrics.total_nps / teamMetrics.active_reps) : 0;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Team Manager Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Week View • Real-time Performance</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Team Selector */}
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
              }}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>

            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md flex items-center gap-2 relative font-semibold">
              <MessageSquare className="w-5 h-5" />
              Rep Requests
              {followUpRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                  {followUpRequests.length}
                </span>
              )}
            </button>

            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 font-semibold">
              <FileText className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Team</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{teamMetrics.active_reps}</div>
            <div className="text-sm text-gray-600">Active Reps</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600">+12%</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{avgOSVPerRep}</div>
            <div className="text-sm text-gray-600">Avg OSV per Rep</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600">+8%</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{avgNPPerRep}</div>
            <div className="text-sm text-gray-600">Avg NP per Rep</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-orange-600">+15%</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">${Math.round(teamMetrics.total_pipeline / 1000)}K</div>
            <div className="text-sm text-gray-600">Pipeline Value</div>
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Team Leaderboard</h2>
                <p className="text-sm text-gray-600">Week View • Click rep name for detailed report</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">{teamMetrics.active_reps} Active Reps</div>
          </div>

          <div className="space-y-4">
            {repMetrics.map((rep, index) => {
              const osvGoal = defaultGoals.awv_goal; // Default weekly goal
              const npGoal = 60; // Default NP goal
              const performanceBadge = getPerformanceBadge(rep.osv_count, osvGoal);
              const goalPercentage = Math.round((rep.osv_count / osvGoal) * 100);

              return (
                <div
                  key={rep.rep_id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => loadRepDetails(rep)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`bg-gradient-to-br ${getPerformanceColor(rep.osv_count, osvGoal)} rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {rep.rep_name}
                        </h3>
                        <p className="text-sm text-gray-600">{rep.rep_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900">{goalPercentage}%</div>
                      <div className="text-sm text-gray-600">Goal Achievement</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">OSV</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{rep.osv_count}</div>
                      <div className="text-xs text-gray-500">of {osvGoal}</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">NP</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{rep.np_count}</div>
                      <div className="text-xs text-gray-500">of {npGoal}</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Close%</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{Math.round(rep.close_ratio)}%</div>
                      <div className="text-xs text-gray-500">ratio</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Pipeline</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${Math.round(rep.pipeline_value / 1000)}K</div>
                      <div className="text-xs text-gray-500">value</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`${performanceBadge.color} px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2`}>
                      <span>{performanceBadge.icon}</span>
                      {performanceBadge.label}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadRepDetails(rep);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 hover:underline"
                    >
                      View Full Report →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rep Follow-Up Requests */}
        {followUpRequests.length > 0 && (
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Rep Follow-Up Requests</h2>
                  <p className="text-orange-100">Items sent from reps needing manager assistance</p>
                </div>
              </div>
              <span className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-lg">
                {followUpRequests.length} Pending
              </span>
            </div>

            <div className="space-y-3 mt-6">
              {followUpRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 text-gray-900">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{request.business_name}</h3>
                        {request.status === 'follow_up' && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                            Ghosted
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Contact:</span>
                          <span className="ml-2 font-semibold">{request.decision_maker}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Rep:</span>
                          <span className="ml-2 font-semibold">{request.rep_name}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">{request.follow_up_notes}</p>
                    </div>
                    <a href={`tel:${request.phone}`} className="ml-4 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Rep Report Modal */}
      {showRepDetails && detailedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{detailedReport.rep.rep_name}</h2>
                  <p className="text-blue-100 mt-1">{detailedReport.rep.rep_email}</p>
                </div>
                <button
                  onClick={() => setShowRepDetails(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Weekly Performance */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  This Week's Performance
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm font-semibold text-blue-700 mb-1">OSVs This Week</div>
                    <div className="text-3xl font-bold text-blue-900">{detailedReport.weeklyBreakdown.osv_this_week}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">NPs This Week</div>
                    <div className="text-3xl font-bold text-green-900">{detailedReport.weeklyBreakdown.np_this_week}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="text-sm font-semibold text-purple-700 mb-1">Closed This Week</div>
                    <div className="text-3xl font-bold text-purple-900">{detailedReport.weeklyBreakdown.closed_this_week}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="text-sm font-semibold text-orange-700 mb-1">Pipeline Added</div>
                    <div className="text-3xl font-bold text-orange-900">${Math.round(detailedReport.weeklyBreakdown.pipeline_this_week / 1000)}K</div>
                  </div>
                </div>
              </div>

              {/* Goals vs Actual */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-600" />
                  Goals vs Actual
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Annual OSV Goal</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {detailedReport.rep.osv_count} / {detailedReport.goals.awv_goal}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${getPerformanceColor(detailedReport.rep.osv_count, detailedReport.goals.awv_goal)} h-3 rounded-full transition-all`}
                        style={{ width: `${Math.min((detailedReport.rep.osv_count / detailedReport.goals.awv_goal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Close Rate Target</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.round(detailedReport.rep.close_ratio)}% / {detailedReport.goals.close_rate}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${getPerformanceColor(detailedReport.rep.close_ratio, detailedReport.goals.close_rate)} h-3 rounded-full transition-all`}
                        style={{ width: `${Math.min((detailedReport.rep.close_ratio / detailedReport.goals.close_rate) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-600" />
                  Recent Leads
                </h3>
                <div className="space-y-2">
                  {detailedReport.recentLeads.slice(0, 8).map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          lead.status === 'closed_won' ? 'bg-green-500' :
                          lead.status === 'presentation' ? 'bg-blue-500' :
                          lead.status === 'qualified' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                        <span className="font-semibold text-gray-900">{lead.business_name}</span>
                        <span className="text-xs text-gray-500 capitalize">{lead.status?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {lead.deal_value && (
                          <span className="text-sm font-semibold text-gray-700">${Math.round(lead.deal_value)}</span>
                        )}
                        <span className="text-xs text-gray-500">{new Date(lead.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Message
                </button>
                <button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule 1-on-1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
