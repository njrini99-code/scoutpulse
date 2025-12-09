'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getTeamForOwner, getTeamRoster, type TeamMember } from '@/lib/queries/team';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ShowcaseRosterPage() {
  const router = useRouter();
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [filteredRoster, setFilteredRoster] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradYear, setSelectedGradYear] = useState<string>('all');

  useEffect(() => {
    loadRoster();
  }, []);

  useEffect(() => {
    filterRoster();
  }, [searchTerm, selectedGradYear, roster]);

  async function loadRoster() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .eq('coach_type', 'showcase')
        .single();

      if (!coach) {
        toast.error('Coach profile not found');
        return;
      }

      const team = await getTeamForOwner(coach.id);
      if (!team) {
        toast.error('Team not found');
        return;
      }

      const rosterData = await getTeamRoster(team.id);
      setRoster(rosterData);
      setFilteredRoster(rosterData);
    } catch (error) {
      console.error('Error loading roster:', error);
      toast.error('Failed to load roster');
    } finally {
      setLoading(false);
    }
  }

  function filterRoster() {
    let filtered = roster;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.player.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGradYear !== 'all') {
      filtered = filtered.filter(member =>
        member.player.grad_year?.toString() === selectedGradYear
      );
    }

    setFilteredRoster(filtered);
  }

  const gradYears = Array.from(new Set(roster.map(m => m.player.grad_year).filter(Boolean))).sort().reverse();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-emerald-600" />
                <h1 className="text-3xl font-bold text-slate-800">Roster</h1>
              </div>
              <p className="text-slate-600">Manage your showcase team roster</p>
            </div>
            <Link href="/coach/showcase/team?tab=roster">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Manage Roster
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedGradYear}
                onChange={(e) => setSelectedGradYear(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-md"
              >
                <option value="all">All Grad Years</option>
                {gradYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Roster Count */}
        <div className="mb-4 text-sm text-slate-600">
          {filteredRoster.length} {filteredRoster.length === 1 ? 'player' : 'players'}
          {searchTerm || selectedGradYear !== 'all' ? ` (filtered from ${roster.length} total)` : ''}
        </div>

        {/* Roster Grid */}
        {filteredRoster.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                {roster.length === 0 ? 'No players in roster yet' : 'No players match your filters'}
              </p>
              {roster.length === 0 && (
                <Link href="/coach/showcase/team?tab=roster">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Players
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoster.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      {member.player.avatar_url ? (
                        <img src={member.player.avatar_url} alt={member.player.full_name || 'Player'} />
                      ) : (
                        <AvatarFallback>
                          {member.player.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {member.player.full_name || 'Player'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {member.player.primary_position && (
                          <Badge variant="secondary" className="text-xs">
                            {member.player.primary_position}
                          </Badge>
                        )}
                        {member.jersey_number && (
                          <Badge variant="outline" className="text-xs">
                            #{member.jersey_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-slate-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>Class of {member.player.grad_year || 'N/A'}</span>
                      </div>
                      {member.player.high_school_state && (
                        <p className="text-xs text-slate-500 mt-1">
                          {member.player.high_school_state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/player/${member.player_id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
