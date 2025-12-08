import { useState, useEffect } from 'react';
import { Users, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface JoinTeamCardProps {
  onTeamJoined?: () => void;
}

export function JoinTeamCard({ onTeamJoined }: JoinTeamCardProps) {
  const { user } = useAuth();
  const [teamCode, setTeamCode] = useState('');
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    loadCurrentTeam();
  }, [user]);

  const loadCurrentTeam = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('team_code, full_name')
      .eq('user_id', user?.id)
      .single();

    if (!error && data?.team_code) {
      setCurrentTeam(data.team_code);

      // Get team name
      const { data: teamData } = await supabase
        .from('teams')
        .select('team_name')
        .eq('team_code', data.team_code)
        .single();

      if (teamData) {
        setTeamName(teamData.team_name);
      }
    }
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      setMessage('Please enter a team code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Verify team exists
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('team_code, team_name')
        .eq('team_code', teamCode.toUpperCase())
        .maybeSingle();

      if (teamError) {
        console.error('Error fetching team:', teamError);
        setMessage(`Error: ${teamError.message}`);
        setLoading(false);
        return;
      }

      if (!teamData) {
        console.log('No team found with code:', teamCode.toUpperCase());
        setMessage('Invalid team code. Please check with your manager.');
        setLoading(false);
        return;
      }

      console.log('Team found:', teamData);

      // Update user settings with team code
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ team_code: teamData.team_code })
        .eq('user_id', user?.id);

      if (updateError) {
        console.error('Error joining team:', updateError);
        setMessage('Failed to join team. Please try again.');
        setLoading(false);
        return;
      }

      // Success!
      setCurrentTeam(teamData.team_code);
      setTeamName(teamData.team_name);
      setMessage(`Successfully joined ${teamData.team_name}!`);
      setTeamCode('');
      setShowJoinForm(false);

      // Notify parent component
      if (onTeamJoined) {
        onTeamJoined();
      }

      // Refresh after 2 seconds to show success
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error joining team:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team? Your manager will no longer see your data.')) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('user_settings')
      .update({ team_code: null })
      .eq('user_id', user?.id);

    if (!error) {
      setCurrentTeam(null);
      setTeamName(null);
      setMessage('Left team successfully');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to leave team');
    }

    setLoading(false);
  };

  if (currentTeam) {
    return (
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Team Member</h3>
              <p className="text-green-100 text-sm">Synced with manager dashboard</p>
            </div>
          </div>
          <CheckCircle className="w-6 h-6" />
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="text-sm text-green-100 mb-1">Team Name</div>
          <div className="text-xl font-bold">{teamName || 'Loading...'}</div>
          <div className="text-sm text-green-100 mt-2">Team Code</div>
          <div className="text-lg font-mono font-semibold">{currentTeam}</div>
        </div>

        <div className="bg-green-400 text-green-900 rounded-lg p-3 mb-4 text-sm">
          <strong>✓ Data Sync Active:</strong> Your KPIs, leads, and performance are now visible to your manager.
        </div>

        <button
          onClick={handleLeaveTeam}
          disabled={loading}
          className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Leave Team'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-3">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Join a Team</h3>
            <p className="text-blue-100 text-sm">Connect with your manager</p>
          </div>
        </div>
      </div>

      {!showJoinForm ? (
        <div>
          <p className="text-blue-50 mb-4 leading-relaxed">
            Join your team to sync your performance data with your manager's dashboard. Ask your manager for the team code.
          </p>
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            Enter Team Code
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-blue-100 mb-2">
              Team Code
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg text-gray-900 font-mono uppercase text-lg tracking-wider focus:ring-2 focus:ring-white outline-none"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('Successfully') || message.includes('Left')
                ? 'bg-green-400 text-green-900'
                : 'bg-red-400 text-red-900'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowJoinForm(false);
                setTeamCode('');
                setMessage('');
              }}
              disabled={loading}
              className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinTeam}
              disabled={loading || !teamCode.trim()}
              className="flex-1 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
