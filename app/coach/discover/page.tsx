'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  MapPin,
  Filter,
  Star,
  User,
  Target,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Users,
  Building,
  X,
  ArrowLeft,
  Eye,
  Video,
  BarChart3
} from 'lucide-react';
import { POSITIONS, GRAD_YEARS, US_STATES, type Player } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface StateCount {
  state: string;
  count: number;
  by_year: Record<string, number>;
}

interface PlayerMetric {
  metric_label: string;
  metric_value: string;
  metric_type: string;
}

export default function CoachDiscoverPage() {
  const [activeView, setActiveView] = useState<'map' | 'state' | 'trending' | 'ai'>('map');
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stateCounts, setStateCounts] = useState<StateCount[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    position: [] as string[],
    gradYear: [] as string[],
    heightMin: '',
    heightMax: '',
    weightMin: '',
    weightMax: '',
    state: [] as string[],
    bats: [] as string[],
    throws: [] as string[],
    exitVeloMin: '',
    pitchVeloMin: '',
    sixtyTimeMax: '',
    videoRequired: false,
    verifiedOnly: false,
  });
  const [trendingPlayers, setTrendingPlayers] = useState<Player[]>([]);
  const [aiMatches, setAiMatches] = useState<Array<{
    player: Player;
    matchScore: number;
    reasons: string[];
  }>>([]);

  useEffect(() => {
    loadData();
  }, [selectedState, filters]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load state counts
    const { data: counts } = await supabase.rpc('get_state_counts');
    if (counts) {
      setStateCounts(counts);
    }

    // Build player query
    let query = supabase
      .from('players')
      .select('*')
      .eq('onboarding_completed', true);

    if (selectedState) {
      query = query.eq('high_school_state', selectedState);
    }

    if (filters.position.length > 0) {
      query = query.in('primary_position', filters.position);
    }

    if (filters.gradYear.length > 0) {
      query = query.in('grad_year', filters.gradYear.map(y => parseInt(y)));
    }

    if (filters.state.length > 0) {
      query = query.in('high_school_state', filters.state);
    }

    const { data: playerData } = await query.limit(100);
    if (playerData) {
      setPlayers(playerData);
      
      // Simulate trending players (top 10 by views - placeholder)
      setTrendingPlayers(playerData.slice(0, 10));
      
      // Simulate AI matches (placeholder)
      setAiMatches(playerData.slice(0, 6).map((p, i) => ({
        player: p,
        matchScore: 85 + Math.floor(Math.random() * 15),
        reasons: ['High spin rate fastball', '6\'3" frame', 'Verified 88mph'],
      })));
    }

    setLoading(false);
  };

  const getStateCount = (state: string) => {
    const found = stateCounts.find(s => s.state === state);
    return found?.count || 0;
  };

  const handleStateClick = (state: string) => {
    setSelectedState(state);
    setActiveView('state');
  };

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    if (category === 'position' || category === 'gradYear' || category === 'state' || category === 'bats' || category === 'throws') {
      setFilters(prev => ({
        ...prev,
        [category]: prev[category].includes(value)
          ? prev[category].filter(v => v !== value)
          : [...prev[category], value],
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      position: [],
      gradYear: [],
      heightMin: '',
      heightMax: '',
      weightMin: '',
      weightMax: '',
      state: [],
      bats: [],
      throws: [],
      exitVeloMin: '',
      pitchVeloMin: '',
      sixtyTimeMax: '',
      videoRequired: false,
      verifiedOnly: false,
    });
  };

  const handleAddToWatchlist = async (playerId: string) => {
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
      toast.success('Added to watchlist');
    }
  };

  // Simple USA Map Component (SVG-based)
  const USAMap = () => {
    const states = US_STATES;
    
    return (
      <div className="relative w-full h-[600px] bg-[#111315] rounded-xl border border-white/5 p-4">
        <div className="grid grid-cols-10 gap-1 h-full">
          {states.map((state) => {
            const count = getStateCount(state);
            const isHovered = hoveredState === state;
            const isSelected = selectedState === state;
            
            return (
              <button
                key={state}
                onClick={() => handleStateClick(state)}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
                className={`
                  relative p-2 rounded text-xs font-medium transition-all duration-300 ease-out
                  ${isSelected 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110 z-10' 
                    : isHovered
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 scale-105 shadow-md shadow-blue-500/20 z-10'
                    : count > 0
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-105 hover:shadow-md'
                    : 'bg-slate-900 text-slate-600'
                  }
                `}
                title={`${state} - ${count} recruits`}
              >
                {state}
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {hoveredState && (
          <div className="absolute top-4 right-4 bg-[#161a1f] border border-white/10 rounded-lg p-4 shadow-xl z-10">
            <h3 className="font-semibold text-white mb-2">{hoveredState}</h3>
            <p className="text-sm text-slate-300">
              {getStateCount(hoveredState)} Recruits
            </p>
            <div className="mt-2 space-y-1">
              {GRAD_YEARS.map(year => (
                <p key={year} className="text-xs text-slate-400">
                  Class of {year}: {Math.floor(getStateCount(hoveredState) / 5)} (estimated)
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Recruits</h1>
          <p className="text-slate-400">
            Your command center for national recruiting
          </p>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-6">
          <TabsList className="bg-[#111315] border border-white/5 p-1">
            <TabsTrigger value="map">USA Map</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="ai">AI Matches</TabsTrigger>
          </TabsList>

          {/* USA Map Tab */}
          <TabsContent value="map" className="space-y-6">
            {selectedState ? (
              <>
                {/* State Drill-Down View */}
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" onClick={() => { setSelectedState(null); setActiveView('map'); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Map
                  </Button>
                  <h2 className="text-2xl font-bold text-white">{selectedState} Recruits</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Top Recruits */}
                  <Card className="bg-[#111315] border-white/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Top Recruits in {selectedState}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-20">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
                        </div>
                      ) : players.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No recruits found in {selectedState}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {players.slice(0, 10).map((player) => (
                            <div
                              key={player.id}
                              className="p-4 bg-[#161a1f] rounded-xl border border-white/5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out group cursor-pointer"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                                  {player.first_name?.[0]}{player.last_name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-white">
                                        {player.first_name} {player.last_name}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        {player.grad_year && (
                                          <Badge variant="outline" className="text-xs">
                                            Class of {player.grad_year}
                                          </Badge>
                                        )}
                                        {player.primary_position && (
                                          <Badge variant="outline" className="text-xs">
                                            {player.primary_position}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddToWatchlist(player.id)}
                                      >
                                        <Star className="w-4 h-4" />
                                      </Button>
                                      <Link href={`/coach/player/${player.id}`}>
                                        <Button variant="ghost" size="sm">
                                          <ChevronRight className="w-4 h-4" />
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                  
                                  {/* Measurables */}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {player.height_feet && (
                                      <span className="text-xs text-slate-400">
                                        {player.height_feet}'{player.height_inches}" • {player.weight_lbs} lbs
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Right: Teams */}
                  <Card className="bg-[#111315] border-white/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Teams in {selectedState}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-slate-400">
                        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Team directory coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <>
                {/* Advanced Filters */}
                <Card className="bg-[#111315] border-white/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-400" />
                        Advanced Filters
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Position Pills */}
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Position</label>
                        <div className="flex flex-wrap gap-2">
                          {POSITIONS.slice(0, 8).map((pos) => (
                            <Badge
                              key={pos}
                              variant={filters.position.includes(pos) ? 'default' : 'outline'}
                              className="cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
                              onClick={() => toggleFilter('position', pos)}
                            >
                              {pos}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Grad Year Pills */}
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Grad Year</label>
                        <div className="flex flex-wrap gap-2">
                          {GRAD_YEARS.map((year) => (
                            <Badge
                              key={year}
                              variant={filters.gradYear.includes(year.toString()) ? 'default' : 'outline'}
                              className="cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
                              onClick={() => toggleFilter('gradYear', year.toString())}
                            >
                              {year}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Measurables */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">Exit Velo Min</label>
                          <Input
                            placeholder="90"
                            value={filters.exitVeloMin}
                            onChange={(e) => setFilters(prev => ({ ...prev, exitVeloMin: e.target.value }))}
                            className="bg-[#161a1f] border-white/5"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">Pitch Velo Min</label>
                          <Input
                            placeholder="85"
                            value={filters.pitchVeloMin}
                            onChange={(e) => setFilters(prev => ({ ...prev, pitchVeloMin: e.target.value }))}
                            className="bg-[#161a1f] border-white/5"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-2 block">60 Time Max</label>
                          <Input
                            placeholder="6.8"
                            value={filters.sixtyTimeMax}
                            onChange={(e) => setFilters(prev => ({ ...prev, sixtyTimeMax: e.target.value }))}
                            className="bg-[#161a1f] border-white/5"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.videoRequired}
                            onChange={(e) => setFilters(prev => ({ ...prev, videoRequired: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-300">Video Required</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.verifiedOnly}
                            onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-300">Verified Only</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* USA Map */}
                <Card className="bg-[#111315] border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">USA Map Recruit Explorer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <USAMap />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Trending Players (National)</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                {trendingPlayers.map((player) => (
                  <Card key={player.id} className="bg-[#111315] border-white/5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {player.first_name} {player.last_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {player.primary_position && (
                                  <Badge variant="outline">{player.primary_position}</Badge>
                                )}
                                {player.grad_year && (
                                  <Badge variant="outline">Class of {player.grad_year}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleAddToWatchlist(player.id)}>
                                <Star className="w-4 h-4" />
                              </Button>
                              <Link href={`/coach/player/${player.id}`}>
                                <Button variant="ghost" size="sm">
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              Viewed by 28 schools this week
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              +63 profile views in 48 hours
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Matches Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">AI Recruit Matches</h2>
            </div>
            <p className="text-slate-400 mb-6">
              Players who fit your recruiting needs based on your historical roster patterns
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiMatches.map((match, i) => (
                  <Card key={i} className="bg-[#111315] border-blue-500/20 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 ease-out">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                          {match.player.first_name?.[0]}{match.player.last_name?.[0]}
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-400 hover:scale-110 transition-transform duration-300">{match.matchScore}</div>
                          <div className="text-xs text-slate-400">Match Score</div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-white mb-2">
                        {match.player.first_name} {match.player.last_name}
                      </h3>
                      <div className="space-y-2 mb-4">
                        {match.reasons.map((reason: string, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            {reason}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAddToWatchlist(match.player.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          Watchlist
                        </Button>
                        <Link href={`/coach/player/${match.player.id}`}>
                          <Button variant="outline" size="sm" className="flex-1">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
