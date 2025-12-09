'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  School,
  Trophy,
  Ruler,
  Weight
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface TeamHistoryEntry {
  id: string;
  year: number;
  team_type: 'high_school' | 'showcase';
  team_name: string;
  stats?: {
    games?: number;
    batting_avg?: number;
    hits?: number;
    doubles?: number;
    triples?: number;
    home_runs?: number;
    rbis?: number;
    stolen_bases?: number;
  };
  verified: boolean;
}

interface PlayerTeamHistoryProps {
  playerId: string;
}

export function PlayerTeamHistory({ playerId }: PlayerTeamHistoryProps) {
  const [teamHistory, setTeamHistory] = useState<TeamHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamHistoryEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    team_type: 'high_school' as 'high_school' | 'showcase',
    team_name: '',
    games: '',
    batting_avg: '',
    hits: '',
    doubles: '',
    triples: '',
    home_runs: '',
    rbis: '',
    stolen_bases: '',
    verified: false
  });

  useEffect(() => {
    loadTeamHistory();
  }, [playerId]);

  const loadTeamHistory = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('player_team_history')
        .select('*')
        .eq('player_id', playerId)
        .order('year', { ascending: false });

      if (error) throw error;

      setTeamHistory(data || []);
    } catch (error) {
      console.error('Error loading team history:', error);
      toast.error('Failed to load team history');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      team_type: 'high_school',
      team_name: '',
      games: '',
      batting_avg: '',
      hits: '',
      doubles: '',
      triples: '',
      home_runs: '',
      rbis: '',
      stolen_bases: '',
      verified: false
    });
  };

  const handleAddTeam = async () => {
    if (!formData.team_name || !formData.year) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const teamData = {
        player_id: playerId,
        year: formData.year,
        team_type: formData.team_type,
        team_name: formData.team_name,
        stats: {
          games: formData.games ? parseInt(formData.games) : undefined,
          batting_avg: formData.batting_avg ? parseFloat(formData.batting_avg) : undefined,
          hits: formData.hits ? parseInt(formData.hits) : undefined,
          doubles: formData.doubles ? parseInt(formData.doubles) : undefined,
          triples: formData.triples ? parseInt(formData.triples) : undefined,
          home_runs: formData.home_runs ? parseInt(formData.home_runs) : undefined,
          rbis: formData.rbis ? parseInt(formData.rbis) : undefined,
          stolen_bases: formData.stolen_bases ? parseInt(formData.stolen_bases) : undefined,
        },
        verified: formData.verified
      };

      const { data, error } = await supabase
        .from('player_team_history')
        .insert(teamData)
        .select()
        .single();

      if (error) throw error;

      setTeamHistory([data, ...teamHistory]);
      setShowAddTeam(false);
      resetForm();
      toast.success('Team added to history');
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to add team');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const updateData = {
        year: formData.year,
        team_type: formData.team_type,
        team_name: formData.team_name,
        stats: {
          games: formData.games ? parseInt(formData.games) : undefined,
          batting_avg: formData.batting_avg ? parseFloat(formData.batting_avg) : undefined,
          hits: formData.hits ? parseInt(formData.hits) : undefined,
          doubles: formData.doubles ? parseInt(formData.doubles) : undefined,
          triples: formData.triples ? parseInt(formData.triples) : undefined,
          home_runs: formData.home_runs ? parseInt(formData.home_runs) : undefined,
          rbis: formData.rbis ? parseInt(formData.rbis) : undefined,
          stolen_bases: formData.stolen_bases ? parseInt(formData.stolen_bases) : undefined,
        },
        verified: formData.verified
      };

      const { error } = await supabase
        .from('player_team_history')
        .update(updateData)
        .eq('id', editingTeam.id);

      if (error) throw error;

      setTeamHistory(teamHistory.map(team =>
        team.id === editingTeam.id
          ? { ...team, ...updateData }
          : team
      ));
      setEditingTeam(null);
      resetForm();
      toast.success('Team updated');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team from your history?')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('player_team_history')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeamHistory(teamHistory.filter(team => team.id !== teamId));
      toast.success('Team removed from history');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const startEdit = (team: TeamHistoryEntry) => {
    setEditingTeam(team);
    setFormData({
      year: team.year,
      team_type: team.team_type,
      team_name: team.team_name,
      games: team.stats?.games?.toString() || '',
      batting_avg: team.stats?.batting_avg?.toString() || '',
      hits: team.stats?.hits?.toString() || '',
      doubles: team.stats?.doubles?.toString() || '',
      triples: team.stats?.triples?.toString() || '',
      home_runs: team.stats?.home_runs?.toString() || '',
      rbis: team.stats?.rbis?.toString() || '',
      stolen_bases: team.stats?.stolen_bases?.toString() || '',
      verified: team.verified
    });
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-900/70 border-white/5 p-6 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Team History
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Track your baseball journey with verified stats
            </p>
          </div>
          <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Team to History</DialogTitle>
              </DialogHeader>
              <TeamForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddTeam}
                onCancel={() => {
                  setShowAddTeam(false);
                  resetForm();
                }}
                saving={saving}
                submitLabel="Add Team"
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {teamHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No teams added yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Start building your baseball resume by adding your teams and stats
              </p>
              <Button
                onClick={() => setShowAddTeam(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamHistory.map((team, index) => (
                <div key={team.id} className="relative">
                  {/* Timeline line */}
                  {index < teamHistory.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-600"></div>
                  )}

                  {/* Team card */}
                  <div className="flex gap-4 relative">
                    {/* Year badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 z-10">
                      {team.year}
                    </div>

                    {/* Team details */}
                    <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{team.team_name}</h4>
                            {team.verified && (
                              <Badge className="bg-blue-500/20 border border-blue-500/30 text-blue-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 flex items-center gap-2">
                            {team.team_type === 'high_school' ? (
                              <School className="w-4 h-4" />
                            ) : (
                              <Trophy className="w-4 h-4" />
                            )}
                            {team.team_type === 'high_school' ? 'High School' : 'Showcase/Travel'}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(team)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats grid */}
                      {team.stats && Object.keys(team.stats).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {team.stats.games && (
                            <div>
                              <div className="text-slate-400">Games</div>
                              <div className="font-semibold text-white">{team.stats.games}</div>
                            </div>
                          )}
                          {team.stats.batting_avg && (
                            <div>
                              <div className="text-slate-400">AVG</div>
                              <div className="font-semibold text-white">{team.stats.batting_avg.toFixed(3)}</div>
                            </div>
                          )}
                          {team.stats.home_runs && (
                            <div>
                              <div className="text-slate-400">HR</div>
                              <div className="font-semibold text-white">{team.stats.home_runs}</div>
                            </div>
                          )}
                          {team.stats.rbis && (
                            <div>
                              <div className="text-slate-400">RBI</div>
                              <div className="font-semibold text-white">{team.stats.rbis}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      {editingTeam && (
        <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateTeam}
              onCancel={() => {
                setEditingTeam(null);
                resetForm();
              }}
              saving={saving}
              submitLabel="Update Team"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

interface TeamFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

function TeamForm({ formData, setFormData, onSubmit, onCancel, saving, submitLabel }: TeamFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Year/Season</Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max="2030"
            value={formData.year}
            onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
            placeholder="2024"
            required
          />
        </div>

        <div>
          <Label htmlFor="team_type">Team Type</Label>
          <select
            id="team_type"
            value={formData.team_type}
            onChange={(e) => setFormData({...formData, team_type: e.target.value})}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
            required
          >
            <option value="high_school">High School</option>
            <option value="showcase">Showcase/Travel</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="team_name">Team Name</Label>
        <Input
          id="team_name"
          value={formData.team_name}
          onChange={(e) => setFormData({...formData, team_name: e.target.value})}
          placeholder="Lincoln High School Varsity"
          required
        />
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Season Stats
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="games" className="text-xs text-slate-400">Games</Label>
            <Input
              id="games"
              type="number"
              value={formData.games}
              onChange={(e) => setFormData({...formData, games: e.target.value})}
              placeholder="25"
            />
          </div>
          <div>
            <Label htmlFor="batting_avg" className="text-xs text-slate-400">Batting AVG</Label>
            <Input
              id="batting_avg"
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={formData.batting_avg}
              onChange={(e) => setFormData({...formData, batting_avg: e.target.value})}
              placeholder="0.285"
            />
          </div>
          <div>
            <Label htmlFor="hits" className="text-xs text-slate-400">Hits</Label>
            <Input
              id="hits"
              type="number"
              value={formData.hits}
              onChange={(e) => setFormData({...formData, hits: e.target.value})}
              placeholder="45"
            />
          </div>
          <div>
            <Label htmlFor="doubles" className="text-xs text-slate-400">Doubles</Label>
            <Input
              id="doubles"
              type="number"
              value={formData.doubles}
              onChange={(e) => setFormData({...formData, doubles: e.target.value})}
              placeholder="8"
            />
          </div>
          <div>
            <Label htmlFor="triples" className="text-xs text-slate-400">Triples</Label>
            <Input
              id="triples"
              type="number"
              value={formData.triples}
              onChange={(e) => setFormData({...formData, triples: e.target.value})}
              placeholder="2"
            />
          </div>
          <div>
            <Label htmlFor="home_runs" className="text-xs text-slate-400">Home Runs</Label>
            <Input
              id="home_runs"
              type="number"
              value={formData.home_runs}
              onChange={(e) => setFormData({...formData, home_runs: e.target.value})}
              placeholder="5"
            />
          </div>
          <div>
            <Label htmlFor="rbis" className="text-xs text-slate-400">RBIs</Label>
            <Input
              id="rbis"
              type="number"
              value={formData.rbis}
              onChange={(e) => setFormData({...formData, rbis: e.target.value})}
              placeholder="28"
            />
          </div>
          <div>
            <Label htmlFor="stolen_bases" className="text-xs text-slate-400">Stolen Bases</Label>
            <Input
              id="stolen_bases"
              type="number"
              value={formData.stolen_bases}
              onChange={(e) => setFormData({...formData, stolen_bases: e.target.value})}
              placeholder="12"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="verified"
          checked={formData.verified}
          onChange={(e) => setFormData({...formData, verified: e.target.checked})}
          className="w-4 h-4"
        />
        <Label htmlFor="verified" className="text-sm text-slate-300">
          These stats are verified by my coach
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onSubmit} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
