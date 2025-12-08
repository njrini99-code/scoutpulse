import { useState, useEffect } from 'react';
import { Users, Plus, TrendingUp, Target, Award, Clock, UserCheck, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Team {
  id: string;
  team_code: string;
  team_name: string;
  manager_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_code: string;
  created_at: string;
}

interface TeamMetrics {
  totalNPs: number;
  totalOSVs: number;
  totalPipeline: number;
  activeReps: number;
}

export function ManagerDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalNPs: 0,
    totalOSVs: 0,
    totalPipeline: 0,
    activeReps: 0,
  });

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
      loadTeamMetrics(selectedTeam.team_code);
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
  };

  const loadTeamMembers = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('id, user_id, full_name, email, team_code, created_at')
      .eq('team_code', team.team_code);

    if (error) {
      console.error('Error loading team members:', error);
      return;
    }

    if (data) {
      setTeamMembers(data as TeamMember[]);
    }
  };

  const loadTeamMetrics = async (teamCode: string) => {
    const { data: members } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('team_code', teamCode);

    if (!members || members.length === 0) {
      setMetrics({ totalNPs: 0, totalOSVs: 0, totalPipeline: 0, activeReps: 0 });
      return;
    }

    const userIds = members.map(m => m.user_id);

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('user_id', userIds);

    if (leads) {
      const totalNPs = leads.filter(l => l.np_set).length;
      const totalOSVs = leads.filter(l => l.osv_completed).length;
      const totalPipeline = leads
        .filter(l => l.deal_value && l.status !== 'closed_lost')
        .reduce((sum, l) => sum + (l.deal_value || 0), 0);

      setMetrics({
        totalNPs,
        totalOSVs,
        totalPipeline,
        activeReps: members.length,
      });
    }
  };

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setLoading(true);

    const teamCode = generateTeamCode();

    const { data, error } = await supabase
      .from('teams')
      .insert({
        team_code: teamCode,
        team_name: teamName,
        manager_id: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
      setLoading(false);
      return;
    }

    if (data) {
      setTeams([data, ...teams]);
      setSelectedTeam(data);
      setShowCreateTeam(false);
      setTeamName('');
    }

    setLoading(false);
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {greeting}, Manager
          </h1>
          <p className="text-lg text-gray-600">Team Performance Overview</p>
        </div>

        {/* Team Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Your Teams
            </h2>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Team
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">You haven't created any teams yet</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTeam?.id === team.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{team.team_name}</h3>
                      <p className="text-sm text-gray-500">Code: {team.team_code}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${
                      selectedTeam?.id === team.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Team</h3>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., East Coast Sales"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateTeam(false);
                    setTeamName('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Metrics */}
        {selectedTeam && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <UserCheck className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Team</span>
                </div>
                <div className="text-4xl font-bold mb-1">{metrics.activeReps}</div>
                <div className="text-blue-100 text-sm">Active Reps</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Total</span>
                </div>
                <div className="text-4xl font-bold mb-1">{metrics.totalNPs}</div>
                <div className="text-green-100 text-sm">New Prospects</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Total</span>
                </div>
                <div className="text-4xl font-bold mb-1">{metrics.totalOSVs}</div>
                <div className="text-purple-100 text-sm">On-Site Visits</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Pipeline</span>
                </div>
                <div className="text-4xl font-bold mb-1">${(metrics.totalPipeline / 1000).toFixed(0)}k</div>
                <div className="text-orange-100 text-sm">Total Value</div>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Team Members - {selectedTeam.team_name}
                </h2>
                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                  Team Code: {selectedTeam.team_code}
                </div>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No team members yet</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Share the team code <span className="font-bold text-blue-600">{selectedTeam.team_code}</span> with your reps
                  </p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-sm text-gray-700">
                      <strong>How it works:</strong> Sales reps enter this code during signup or in their settings to join your team.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 rounded-full p-3">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.full_name || 'Unnamed Rep'}
                            </h3>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
