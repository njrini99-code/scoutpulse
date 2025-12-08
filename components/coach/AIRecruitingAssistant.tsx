'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, TrendingUp, X, ThumbsDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RecommendedPlayer {
  id: string;
  name: string;
  position: string;
  location: string;
  graduationYear: number;
  keyStats: Record<string, any>;
  reasoning: string;
  matchScore: number;
}

export function AIRecruitingAssistant() {
  const [recommendations, setRecommendations] = useState<RecommendedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) return;

      // Analyze coach preferences from watchlist and search history
      const { data: watchlist } = await supabase
        .from('recruit_watchlist')
        .select('player_id, player:players(*)')
        .eq('coach_id', coachData.id)
        .limit(20);

      if (!watchlist || watchlist.length === 0) {
        setLoading(false);
        return;
      }

      // Extract preferences from watchlisted players
      const preferences = analyzePreferences(watchlist);

      // Find matching players based on preferences
      const { data: players } = await supabase
        .from('players')
        .select('id, first_name, last_name, position, city, state, graduation_year, player_stats(*)')
        .not('id', 'in', `(${watchlist.map(w => w.player_id).join(',')})`)
        .limit(100);

      if (!players) return;

      // Score and rank players
      const scored = players.map(player => ({
        ...player,
        score: calculateMatchScore(player, preferences),
        reasoning: generateReasoning(player, preferences)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        position: p.position || 'Unknown',
        location: `${p.city || ''}, ${p.state || ''}`.trim(),
        graduationYear: p.graduation_year,
        keyStats: p.player_stats?.[0] || {},
        reasoning: p.reasoning,
        matchScore: p.score
      }));

      setRecommendations(scored);
      setLoading(false);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setLoading(false);
    }
  };

  const analyzePreferences = (watchlist: any[]) => {
    const positions: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const gradYears: Record<number, number> = {};

    watchlist.forEach(item => {
      const player = item.player;
      if (player?.position) {
        positions[player.position] = (positions[player.position] || 0) + 1;
      }
      if (player?.state) {
        locations[player.state] = (locations[player.state] || 0) + 1;
      }
      if (player?.graduation_year) {
        gradYears[player.graduation_year] = (gradYears[player.graduation_year] || 0) + 1;
      }
    });

    return {
      topPosition: Object.entries(positions).sort((a, b) => b[1] - a[1])[0]?.[0],
      topLocation: Object.entries(locations).sort((a, b) => b[1] - a[1])[0]?.[0],
      topGradYear: Object.entries(gradYears).sort((a, b) => b[1] - a[1])[0]?.[0] as number
    };
  };

  const calculateMatchScore = (player: any, preferences: any): number => {
    let score = 0;
    
    if (player.position === preferences.topPosition) score += 30;
    if (player.state === preferences.topLocation) score += 25;
    if (player.graduation_year === preferences.topGradYear) score += 20;
    
    // Add some randomness for variety
    score += Math.random() * 25;
    
    return score;
  };

  const generateReasoning = (player: any, preferences: any): string => {
    const reasons: string[] = [];
    
    if (player.position === preferences.topPosition) {
      reasons.push(`matches your interest in ${preferences.topPosition}s`);
    }
    if (player.state === preferences.topLocation) {
      reasons.push(`located in ${preferences.topLocation}`);
    }
    if (player.graduation_year === preferences.topGradYear) {
      reasons.push(`graduating in ${preferences.topGradYear}`);
    }
    
    return reasons.length > 0 
      ? `Based on your interest in ${reasons.join(', ')}`
      : 'Recommended based on your recruiting patterns';
  };

  const handleNotInterested = async (playerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store feedback to improve recommendations
      await supabase
        .from('ai_feedback')
        .insert({
          user_id: user.id,
          player_id: playerId,
          feedback: 'not_interested',
          created_at: new Date().toISOString()
        });

      setRecommendations(prev => prev.filter(r => r.id !== playerId));
      toast.success('Feedback recorded. Recommendations will improve.');
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <div className="text-sm text-muted-foreground">Analyzing your preferences...</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Add players to your watchlist to get personalized recommendations.
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="font-semibold">AI Recruiting Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {recommendations.length} personalized recommendations
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isExpanded ? <X className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {recommendations.map((player) => (
            <div
              key={player.id}
              className="p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{player.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {player.position} • {player.location} • {player.graduationYear}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic mb-2">
                    {player.reasoning}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                      {Math.round(player.matchScore)}% match
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotInterested(player.id);
                  }}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = `/coach/player/${player.id}`}
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data: coachData } = await supabase
                      .from('coaches')
                      .select('id')
                      .eq('user_id', user.id)
                      .single();
                    if (coachData) {
                      await supabase.from('recruit_watchlist').insert({
                        coach_id: coachData.id,
                        player_id: player.id,
                        status: 'watchlist'
                      });
                      toast.success('Added to watchlist');
                    }
                  }}
                >
                  Add to Watchlist
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
