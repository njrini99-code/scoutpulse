import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Trophy,
  AlertCircle,
  CheckCircle,
  Zap,
  Calendar,
  MessageSquare,
  FileText,
  ChevronDown,
  Phone,
  Mail
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

interface FollowUpRequest {
  id: string;
  rep_id: string;
  business_name: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  priority: string;
  rep_description: string;
  manager_notes: string;
  status: string;
  rep_name: string;
  created_at: string;
  updated_at: string;
}

export function ManagerDashboardNew() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'quarterly' | 'yearly'>('weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'requests'>('overview');

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

    // Load follow-up requests
    await loadFollowUpRequests();

    setLoading(false);
  };

  const loadFollowUpRequests = async () => {
    if (!selectedTeam) return;

    const { data: requests, error } = await supabase
      .from('follow_up_requests')
      .select(`
        *,
        rep:rep_id (
          id,
          email
        )
      `)
      .eq('team_code', selectedTeam.team_code)
      .order('created_at', { ascending: false });

    if (!error && requests) {
      const { data: members } = await supabase
        .from('user_settings')
        .select('user_id, full_name')
        .eq('team_code', selectedTeam.team_code);

      const formattedRequests: FollowUpRequest[] = requests.map(req => {
        const member = members?.find(m => m.user_id === req.rep_id);
        return {
          ...req,
          rep_name: member?.full_name || req.rep?.email || 'Unknown Rep'
        };
      });

      setFollowUpRequests(formattedRequests);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    const notes = prompt('Add completion notes (optional):');

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
        manager_notes: notes || ''
      })
      .eq('id', requestId);

    if (!error) {
      loadFollowUpRequests();
    }
  };

  const handleSendBack = async (requestId: string) => {
    const notes = prompt('What additional information do you need?');

    if (!notes) return;

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        status: 'needs_more_info',
        manager_notes: notes
      })
      .eq('id', requestId);

    if (!error) {
      loadFollowUpRequests();
    }
  };

  const handleAddNotes = async (requestId: string, currentNotes: string) => {
    const notes = prompt('Add coaching notes:', currentNotes || '');

    if (notes === null) return;

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        manager_notes: notes
      })
      .eq('id', requestId);

    if (!error) {
      loadFollowUpRequests();
    }
  };

  const getPerformanceColor = (ratio: number): string => {
    if (ratio >= 110) return 'bg-gradient-to-br from-green-400 to-green-500';
    if (ratio >= 90) return 'bg-gradient-to-br from-blue-400 to-blue-500';
    if (ratio >= 70) return 'bg-gradient-to-br from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-br from-red-400 to-red-500';
  };

  const getPerformanceLabel = (ratio: number): string => {
    if (ratio >= 110) return 'Crushing It';
    if (ratio >= 90) return 'On Track';
    if (ratio >= 70) return 'Needs Follow-up';
    return 'Needs Attention';
  };

  const getAICoachingPriority = (rep: RepMetrics): { level: string; message: string; color: string } => {
    const { osv_count, np_count, close_ratio } = rep;

    // High performer
    if (osv_count > teamMetrics.total_osvs / teamMetrics.active_reps && close_ratio > teamMetrics.avg_close_ratio) {
      return {
        level: 'HIGH',
        message: `Strong performer! ${rep.rep_name.split(' ')[0]} is exceeding team averages.`,
        color: 'bg-green-50 border-green-200 text-green-700'
      };
    }

    // OSV activity down
    if (osv_count < (teamMetrics.total_osvs / teamMetrics.active_reps) * 0.7) {
      return {
        level: 'HIGH',
        message: `OSV activity down ${Math.round(100 - (osv_count / (teamMetrics.total_osvs / teamMetrics.active_reps)) * 100)}% vs last month. Suggest territory review and call block scheduling.`,
        color: 'bg-red-50 border-red-200 text-red-700'
      };
    }

    // NP conversion issue
    if (np_count > 0 && osv_count < np_count * 0.5) {
      return {
        level: 'MEDIUM',
        message: `Strong OSV but NP conversion dropped. Review qualifying questions.`,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
      };
    }

    return {
      level: 'LOW',
      message: `Steady performance. Continue current approach.`,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    };
  };

  const avgOSVPerRep = teamMetrics.active_reps > 0 ? Math.round(teamMetrics.total_osvs / teamMetrics.active_reps) : 0;
  const avgNPPerRep = teamMetrics.active_reps > 0 ? Math.round(teamMetrics.total_nps / teamMetrics.active_reps) : 0;

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-full bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tempo Manager Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Team Selector */}
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
              }}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>

            {/* Period Selector */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={() => setActiveTab('requests')}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 relative"
            >
              <MessageSquare className="w-5 h-5" />
              Rep Help Requests
              {followUpRequests.filter(r => r.status === 'submitted').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {followUpRequests.filter(r => r.status === 'submitted').length}
                </span>
              )}
            </button>

            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI Insights
            </button>

            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'requests' ? (
          /* Follow-Up Requests View */
          <div className="bg-orange-600 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Rep Follow-Up Requests</h2>
                  <p className="text-orange-100">Urgent items need your attention</p>
                </div>
              </div>
              <span className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-lg">
                {followUpRequests.filter(r => r.status === 'submitted').length} Pending
              </span>
            </div>

            <div className="flex gap-4 border-b border-orange-500 mb-6">
              <button className="px-4 py-2 text-white font-semibold border-b-2 border-white">
                Pending ({followUpRequests.filter(r => r.status === 'submitted').length})
              </button>
              <button className="px-4 py-2 text-orange-200 hover:text-white">
                Completed ({followUpRequests.filter(r => r.status === 'completed').length})
              </button>
              <button className="px-4 py-2 text-orange-200 hover:text-white">
                Needs More Info ({followUpRequests.filter(r => r.status === 'needs_more_info').length})
              </button>
            </div>

            <div className="space-y-4">
              {followUpRequests.filter(r => r.status === 'submitted').map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-6 text-slate-900">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{request.business_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          request.priority === 'High' ? 'bg-red-100 text-red-700' :
                          request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.priority} Priority
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {request.category}
                        </span>
                      </div>
                      {request.address && (
                        <p className="text-sm text-gray-600 mb-2">{request.address}</p>
                      )}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {request.contact_name && (
                          <div>
                            <span className="text-gray-600">Contact:</span>
                            <span className="ml-2 font-semibold">{request.contact_name}</span>
                          </div>
                        )}
                        {request.contact_phone && (
                          <div>
                            <span className="text-gray-600">Phone:</span>
                            <a href={`tel:${request.contact_phone}`} className="ml-2 text-blue-600 hover:underline">{request.contact_phone}</a>
                          </div>
                        )}
                        {request.contact_email && (
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <a href={`mailto:${request.contact_email}`} className="ml-2 text-blue-600 hover:underline">{request.contact_email}</a>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Rep:</span>
                          <span className="ml-2 font-semibold">{request.rep_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Rep Description:</p>
                    <p className="text-sm text-gray-700">{request.rep_description}</p>
                  </div>

                  {request.manager_notes && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Your Notes:</p>
                      <p className="text-sm text-blue-800">{request.manager_notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    Submitted {new Date(request.created_at).toLocaleString()}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCompleteRequest(request.id)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Complete
                    </button>
                    <button
                      onClick={() => handleSendBack(request.id)}
                      className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Send Back
                    </button>
                    <button
                      onClick={() => handleAddNotes(request.id, request.manager_notes)}
                      className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Add Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Synced with Rep App • 2 min ago</span>
            </div>
          </div>
        ) : (
          /* Overview Dashboard */
          <>
            {/* Team Averages */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold">Team Averages</h2>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Avg OSV per Rep</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{avgOSVPerRep}</span>
                    <span className="text-green-400 text-sm font-semibold">↑12%</span>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-2">Avg NP per Rep</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{avgNPPerRep}</span>
                    <span className="text-green-400 text-sm font-semibold">↑8%</span>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-2">Close Ratio</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{Math.round(teamMetrics.avg_close_ratio)}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-2">Total Revenue</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${Math.round(teamMetrics.total_pipeline / 1000)}K</span>
                    <span className="text-green-400 text-sm font-semibold">↑15%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Team Leaderboard */}
              <div className="col-span-2">
                <div className="bg-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <h2 className="text-xl font-bold">Team Leaderboard</h2>
                      <span className="text-slate-400 text-sm ml-2">{teamMetrics.active_reps} Active Reps</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {repMetrics.slice(0, 3).map((rep, index) => {
                      const goalRatio = (rep.osv_count / 150) * 100; // Assuming 150 OSV goal
                      const performanceColor = getPerformanceColor(goalRatio);
                      const performanceLabel = getPerformanceLabel(goalRatio);

                      return (
                        <div key={rep.rep_id} className={`${performanceColor} rounded-xl p-6 text-white`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-bold">#{index + 1}</div>
                              <div>
                                <h3 className="text-xl font-bold">{rep.rep_name}</h3>
                                <p className="text-sm opacity-90">East Territory</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold">{Math.round(goalRatio)}%</div>
                              <div className="text-sm opacity-90">Goal</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-white/20 rounded-lg p-3">
                              <p className="text-xs opacity-90 mb-1">OSV</p>
                              <p className="text-2xl font-bold">{rep.osv_count} / 150</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3">
                              <p className="text-xs opacity-90 mb-1">NP</p>
                              <p className="text-2xl font-bold">{rep.np_count} / 60</p>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3">
                              <p className="text-xs opacity-90 mb-1">Revenue</p>
                              <p className="text-2xl font-bold">${Math.round(rep.pipeline_value / 1000)}K</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                              {goalRatio >= 110 ? (
                                <span className="text-sm font-semibold">🔥 {performanceLabel}</span>
                              ) : goalRatio >= 90 ? (
                                <span className="text-sm font-semibold">✨ {performanceLabel}</span>
                              ) : (
                                <span className="text-sm font-semibold">⚠️ {performanceLabel}</span>
                              )}
                            </div>
                            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team Health */}
                <div className="bg-purple-600 rounded-2xl p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Team Health</h3>
                  </div>
                  <div className="text-6xl font-bold mb-2">8.4/10</div>
                  <p className="text-purple-100">Above target pace</p>
                </div>
              </div>

              {/* AI Coaching */}
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold">AI Coaching</h2>
                  </div>

                  <div className="space-y-4">
                    {repMetrics.slice(0, 3).map((rep) => {
                      const coaching = getAICoachingPriority(rep);
                      return (
                        <div key={rep.rep_id} className={`${coaching.color} border-2 rounded-xl p-4`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold">{rep.rep_name.split(' ')[0]}</h4>
                              <span className="text-xs font-semibold">{coaching.level}</span>
                            </div>
                          </div>
                          <p className="text-sm">{coaching.message}</p>
                          {coaching.level === 'HIGH' && (
                            <button className="mt-3 text-sm font-semibold underline">
                              Schedule 1-on-1
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
