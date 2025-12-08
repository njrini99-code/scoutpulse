'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Filter,
  Search,
  Users,
  Eye,
  Video,
  Loader2,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

interface Recruit {
  id: string;
  player_id: string;
  name: string;
  grad_year: string | null;
  primary_position: string | null;
  high_school_name: string | null;
  stage: string;
  priority: string;
  notes: string | null;
  player?: {
    first_name: string | null;
    last_name: string | null;
    grad_year: number | null;
    primary_position: string | null;
    height_feet: number | null;
    height_inches: number | null;
    weight_lbs: number | null;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Players', icon: Users },
  { id: 'pitchers', label: 'Pitchers', icon: Users },
  { id: 'infielders', label: 'Infielders', icon: Users },
  { id: 'outfielders', label: 'Outfielders', icon: Users },
  { id: 'catchers', label: 'Catchers', icon: Users },
];

const INTEREST_LEVELS = [
  { value: 'A', label: 'High', color: 'bg-emerald-500' },
  { value: 'B', label: 'Medium', color: 'bg-blue-500' },
  { value: 'C', label: 'Low', color: 'bg-slate-500' },
];

const STAGES = [
  { id: 'watchlist', label: 'Watchlist', color: 'blue' },
  { id: 'evaluating', label: 'Evaluating', color: 'yellow' },
  { id: 'high_priority', label: 'High Priority', color: 'orange' },
  { id: 'offered', label: 'Offered', color: 'green' },
  { id: 'committed', label: 'Committed', color: 'emerald' },
];

export default function CoachWatchlistPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Button styles that work in both modes
  const buttonStyles = {
    primary: isDark 
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    secondary: isDark 
      ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' 
      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm',
    outline: isDark 
      ? 'border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white' 
      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    ghost: isDark 
      ? 'hover:bg-slate-700 text-slate-300' 
      : 'hover:bg-emerald-50 text-emerald-700',
  };

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    inputBg: isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-emerald-200 text-slate-800',
    columnBg: isDark ? 'bg-slate-800/50' : 'bg-emerald-50/50',
    recruitCardBg: isDark ? 'bg-slate-700/50 border-slate-600 hover:border-emerald-500/50' : 'bg-white border-emerald-100 hover:border-emerald-300 shadow-sm',
  };

  useEffect(() => {
    loadRecruits();
  }, []);

  const loadRecruits = async () => {
    const supabase = createClient();
    
    let coachId: string | null = null;
    
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

      if (!coachData) {
        setLoading(false);
        return;
      }
      coachId = coachData.id;
    }

    const { data: recruitsData } = await supabase
      .from('recruits')
      .select(`
        *,
        players:player_id (
          first_name,
          last_name,
          grad_year,
          primary_position,
          height_feet,
          height_inches,
          weight_lbs
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (recruitsData) {
      const formatted: Recruit[] = recruitsData.map(r => ({
        ...r,
        player: r.players as any,
        name: r.name || `${(r.players as any)?.first_name || ''} ${(r.players as any)?.last_name || ''}`.trim(),
      }));
      setRecruits(formatted);
    }

    setLoading(false);
  };

  const getRecruitsByCategory = (category: string) => {
    const positionMap: Record<string, string[]> = {
      pitchers: ['Pitcher', 'P'],
      infielders: ['First Base', 'Second Base', 'Third Base', 'Shortstop', '1B', '2B', '3B', 'SS'],
      outfielders: ['Left Field', 'Center Field', 'Right Field', 'LF', 'CF', 'RF'],
      catchers: ['Catcher', 'C'],
    };

    if (category === 'all') return recruits;
    
    const positions = positionMap[category] || [];
    
    return recruits.filter(r => {
      const playerPos = r.player?.primary_position || r.primary_position;
      return positions.includes(playerPos || '');
    });
  };

  const getInterestColor = (priority: string) => {
    const level = INTEREST_LEVELS.find(l => l.value === priority);
    return level?.color || 'bg-slate-500';
  };

  const getStageColor = (stageId: string) => {
    const stage = STAGES.find(s => s.id === stageId);
    const colors: Record<string, string> = {
      blue: isDark ? 'border-blue-500/50' : 'border-blue-400',
      yellow: isDark ? 'border-yellow-500/50' : 'border-yellow-400',
      orange: isDark ? 'border-orange-500/50' : 'border-orange-400',
      green: isDark ? 'border-green-500/50' : 'border-green-400',
      emerald: isDark ? 'border-emerald-500/50' : 'border-emerald-400',
    };
    return colors[stage?.color || 'blue'] || colors.blue;
  };

  const filteredRecruits = getRecruitsByCategory(selectedCategory).filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.player?.first_name?.toLowerCase().includes(query) ||
      r.player?.last_name?.toLowerCase().includes(query) ||
      r.high_school_name?.toLowerCase().includes(query)
    );
  });

  const handleViewPlayer = (playerId: string) => {
    router.push(`/coach/player/${playerId}`);
  };

  const handleMessagePlayer = (playerId: string, playerName: string) => {
    toast.success(`Opening message to ${playerName}...`);
    router.push(`/coach/college/messages?player=${playerId}`);
  };

  const handleRemoveFromWatchlist = async (recruitId: string, playerName: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .delete()
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to remove from watchlist');
    } else {
      toast.success(`${playerName} removed from watchlist`);
      setRecruits(recruits.filter(r => r.id !== recruitId));
    }
  };

  const handleUpdateStage = async (recruitId: string, newStage: string, playerName: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ stage: newStage })
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to update stage');
    } else {
      const stageName = STAGES.find(s => s.id === newStage)?.label;
      toast.success(`${playerName} moved to ${stageName}`);
      setRecruits(recruits.map(r => r.id === recruitId ? { ...r, stage: newStage } : r));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>Watchlist</h1>
            <p className={theme.textMuted}>
              Your personal recruiting board • {recruits.length} total recruits
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/coach/college/recruiting-planner">
              <Button className={buttonStyles.secondary}>
                <Eye className="w-4 h-4 mr-2" />
                View Planner
              </Button>
            </Link>
            <Link href="/coach/college/discover">
              <Button className={buttonStyles.primary}>
                <Plus className="w-4 h-4 mr-2" />
                Find Players
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
            <Input
              placeholder="Search recruits..."
              className={`pl-9 ${theme.inputBg}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className={buttonStyles.outline}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const count = getRecruitsByCategory(category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${selectedCategory === category.id
                    ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25')
                    : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-200')
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {category.label}
                {count > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-emerald-100 text-emerald-700')
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const stageRecruits = filteredRecruits.filter(r => r.stage === stage.id);
            return (
              <div key={stage.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${theme.text}`}>{stage.label}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-emerald-50 text-emerald-700'}`}>
                    {stageRecruits.length}
                  </span>
                </div>
                <div className={`min-h-[500px] rounded-xl border-2 ${getStageColor(stage.id)} p-3 space-y-3 ${theme.columnBg}`}>
                  {stageRecruits.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-40 text-sm ${theme.textMuted}`}>
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p>No recruits</p>
                      <Link href="/coach/college/discover">
                        <Button size="sm" className={`mt-3 ${buttonStyles.outline}`}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    stageRecruits.map((recruit) => (
                      <Card
                        key={recruit.id}
                        className={`border transition-all duration-300 ease-out cursor-pointer group hover:-translate-y-1 ${theme.recruitCardBg}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                              {recruit.player?.first_name?.[0]}{recruit.player?.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 
                                className={`font-semibold text-sm truncate cursor-pointer hover:text-emerald-500 ${theme.text}`}
                                onClick={() => handleViewPlayer(recruit.player_id)}
                              >
                                {recruit.name}
                              </h4>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {recruit.player?.grad_year && (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isDark ? 'border-slate-600 text-slate-300' : 'border-emerald-200 text-emerald-700'}`}>
                                    '{String(recruit.player.grad_year).slice(-2)}
                                  </Badge>
                                )}
                                {recruit.player?.primary_position && (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isDark ? 'border-slate-600 text-slate-300' : 'border-emerald-200 text-emerald-700'}`}>
                                    {recruit.player.primary_position}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Interest Level */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${getInterestColor(recruit.priority)}`} />
                            <span className={`text-xs ${theme.textMuted}`}>
                              {INTEREST_LEVELS.find(l => l.value === recruit.priority)?.label || 'Medium'} Priority
                            </span>
                          </div>

                          {/* Stage Selector */}
                          <Select
                            value={recruit.stage}
                            onValueChange={(value) => handleUpdateStage(recruit.id, value, recruit.name)}
                          >
                            <SelectTrigger className={`h-7 text-xs mb-2 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Actions */}
                          <div className={`flex items-center gap-1 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-emerald-100'}`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`flex-1 h-7 text-xs ${buttonStyles.ghost}`}
                              onClick={() => handleViewPlayer(recruit.player_id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-7 px-2 ${buttonStyles.ghost}`}
                              onClick={() => handleMessagePlayer(recruit.player_id, recruit.name)}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 ${isDark ? 'hover:bg-red-900/20' : ''}`}
                              onClick={() => handleRemoveFromWatchlist(recruit.id, recruit.name)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
