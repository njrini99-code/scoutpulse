'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Users, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitiveData {
  playerId: string;
  playerName: string;
  competitionLevel: 'high' | 'medium' | 'low';
  otherCoaches: number;
  recentActivity: number;
  interestTrend: 'increasing' | 'decreasing' | 'stable';
}

export function CompetitiveIntelligence({ playerId }: { playerId?: string }) {
  const [data, setData] = useState<CompetitiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCompetitiveData();
  }, [playerId]);

  const loadCompetitiveData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach's watchlist
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) return;

      const { data: watchlist } = await supabase
        .from('recruit_watchlist')
        .select('player_id')
        .eq('coach_id', coachData.id)
        .limit(20);

      if (!watchlist) return;

      // For each player, check competition
      const competitiveData: CompetitiveData[] = await Promise.all(
        watchlist.map(async (item) => {
          // Count other coaches viewing this player
          const { count: otherCoaches } = await supabase
            .from('recruit_watchlist')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', item.player_id)
            .neq('coach_id', coachData.id);

          // Count recent profile views
          const { count: recentViews } = await supabase
            .from('profile_views')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', item.player_id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          // Get player name
          const { data: player } = await supabase
            .from('players')
            .select('first_name, last_name')
            .eq('id', item.player_id)
            .single();

          const competitionLevel = (otherCoaches || 0) > 5 ? 'high' : 
                                  (otherCoaches || 0) > 2 ? 'medium' : 'low';
          
          const interestTrend = (recentViews || 0) > 10 ? 'increasing' :
                               (recentViews || 0) > 5 ? 'stable' : 'decreasing';

          return {
            playerId: item.player_id,
            playerName: player ? `${player.first_name} ${player.last_name}` : 'Unknown',
            competitionLevel,
            otherCoaches: otherCoaches || 0,
            recentActivity: recentViews || 0,
            interestTrend
          };
        })
      );

      setData(competitiveData.sort((a, b) => b.otherCoaches - a.otherCoaches));
      setLoading(false);
    } catch (error) {
      console.error('Error loading competitive data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading competitive intelligence...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No competitive data available yet.</p>
      </div>
    );
  }

  const highCompetition = data.filter(d => d.competitionLevel === 'high').length;
  const avgCompetition = data.reduce((sum, d) => sum + d.otherCoaches, 0) / data.length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Competitive Intelligence</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">High Competition</p>
            <p className="text-2xl font-bold">{highCompetition}</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Avg. Competition</p>
            <p className="text-2xl font-bold">{avgCompetition.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.map((item) => (
          <div
            key={item.playerId}
            className={cn(
              "p-3 rounded-lg border transition-colors",
              item.competitionLevel === 'high' && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
              item.competitionLevel === 'medium' && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20",
              item.competitionLevel === 'low' && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{item.playerName}</p>
              <div className="flex items-center gap-2">
                {item.interestTrend === 'increasing' && (
                  <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                {item.interestTrend === 'decreasing' && (
                  <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  item.competitionLevel === 'high' && "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
                  item.competitionLevel === 'medium' && "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
                  item.competitionLevel === 'low' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                )}>
                  {item.competitionLevel.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{item.otherCoaches} other coaches</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{item.recentActivity} views (7d)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {highCompetition > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              High Competition Alert
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {highCompetition} players in your watchlist have high competition. Consider prioritizing outreach.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
