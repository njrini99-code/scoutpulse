'use client';

import { useCurrentPlayer } from '@/lib/hooks/useCurrentPlayer';
import { PlayerPerformanceFilters } from '@/components/player/dashboard/Performance/player-performance-filters';
import { PlayerPerformanceSummaryTiles } from '@/components/player/dashboard/Performance/player-performance-summary-tiles';
import { PlayerPerformanceCharts } from '@/components/player/dashboard/Performance/player-performance-charts';
import { PlayerPerformanceGamesTable } from '@/components/player/dashboard/Performance/player-performance-games-table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { Card } from '@/components/ui/card';
import { getPlayerStatsSeries, type PerformanceFilters, type PlayerStatsResponse } from '@/lib/api/player/getPlayerStatsSeries';

export default function PlayerPerformancePage() {
  const { player, isLoading: loadingPlayer, error } = useCurrentPlayer();
  const [filters, setFilters] = useState<PerformanceFilters>({
    source: 'all',
    dateRange: { from: null, to: null, preset: '30d' },
  });
  const [data, setData] = useState<PlayerStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player) return;
    
    const loadStats = async () => {
      setLoading(true);
      try {
        const statsData = await getPlayerStatsSeries(player.id, filters);
        setData(statsData);
      } catch (error) {
        logError(error, { component: 'PlayerPerformancePage', action: 'loadStats' });
        toast.error('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [player, filters]);

  if (loadingPlayer) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-6 text-white">
        <p className="text-sm text-slate-300">We could not load your profile yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PlayerPerformanceFilters value={filters} onChange={setFilters} />
      <PlayerPerformanceSummaryTiles summary={data?.summary} loading={loading} />
      <div className="grid gap-6 lg:grid-cols-2">
        <PlayerPerformanceCharts series={data?.series || []} loading={loading} />
        <PlayerPerformanceGamesTable games={data?.games || []} loading={loading} />
      </div>
    </div>
  );
}
