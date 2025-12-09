'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type Stat = { label: string; value: string; helper?: string };

export function PlayerOverviewQuickStats({ playerId }: { playerId: string }) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [playerId]);

  const loadStats = async () => {
    const supabase = createClient();

    // Fetch player metrics from database
    const { data: metrics, error } = await supabase
      .from('player_metrics')
      .select('metric_label, metric_value, metric_type, context')
      .eq('player_id', playerId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading player metrics:', error);
      setLoading(false);
      return;
    }

    if (metrics && metrics.length > 0) {
      // Map database metrics to display format
      const mappedStats: Stat[] = metrics.slice(0, 6).map(m => ({
        label: m.metric_label,
        value: m.metric_value,
        helper: m.context || undefined
      }));
      setStats(mappedStats);
    } else {
      // Show placeholder when no metrics exist
      setStats([
        { label: 'BA', value: '--', helper: 'No stats yet' },
        { label: 'HR', value: '--' },
        { label: 'RBI', value: '--' },
        { label: 'OBP', value: '--' },
        { label: 'SLG', value: '--' },
        { label: 'OPS', value: '--' },
      ]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">Quick stats</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-12 mb-2"></div>
              <div className="h-5 bg-white/10 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-300">Quick stats</p>
        {stats.length > 0 && stats[0].value !== '--' && (
          <span className="text-xs text-slate-500">Season stats</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className="text-lg font-semibold">{stat.value}</p>
            {stat.helper && <p className="text-[11px] text-slate-500">{stat.helper}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
