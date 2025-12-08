'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StatDataPoint {
  date: string;
  value: number;
  label: string;
}

interface PerformanceTrendsProps {
  playerId?: string;
  statType?: 'era' | 'batting_avg' | 'velocity' | 'pop_time';
}

export function PerformanceTrends({ playerId, statType = 'era' }: PerformanceTrendsProps) {
  const [data, setData] = useState<StatDataPoint[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTrendData();
  }, [playerId, statType]);

  const loadTrendData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetPlayerId = playerId || (await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()).data?.id;

      if (!targetPlayerId) return;

      // Fetch stat history (assuming we have a stats_history table)
      const { data: statsHistory } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', targetPlayerId)
        .order('created_at', { ascending: true });

      if (statsHistory && statsHistory.length > 0) {
        const trendData: StatDataPoint[] = statsHistory.map((stat, index) => ({
          date: new Date(stat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: getStatValue(stat, statType),
          label: `Game ${index + 1}`
        }));

        setData(trendData);
        calculateTrend(trendData);
      }
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatValue = (stat: any, type: string): number => {
    switch (type) {
      case 'era':
        return stat.era || 0;
      case 'batting_avg':
        return stat.batting_average || 0;
      case 'velocity':
        return stat.fastball_velocity || stat.exit_velocity || 0;
      case 'pop_time':
        return stat.pop_time || 0;
      default:
        return 0;
    }
  };

  const calculateTrend = (dataPoints: StatDataPoint[]) => {
    if (dataPoints.length < 2) {
      setTrend('stable');
      return;
    }

    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 2) {
      setTrend('stable');
    } else if (change > 0) {
      setTrend('up');
    } else {
      setTrend('down');
    }
  };

  if (loading) {
    return <div className="p-4">Loading trends...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No trend data available yet.</p>
        <p className="text-sm">Add more stats to see your performance trends.</p>
      </div>
    );
  }

  const statLabels: Record<string, string> = {
    era: 'ERA',
    batting_avg: 'Batting Average',
    velocity: 'Velocity (mph)',
    pop_time: 'Pop Time (s)'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{statLabels[statType]} Trend</h3>
          <p className="text-sm text-muted-foreground">Performance over time</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full",
          trend === 'up' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
          trend === 'down' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
          trend === 'stable' && "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        )}>
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4" />}
          {trend === 'stable' && <Minus className="w-4 h-4" />}
          <span className="text-sm font-medium capitalize">{trend}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={statLabels[statType]}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">First</p>
          <p className="text-lg font-semibold">{data[0]?.value.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Latest</p>
          <p className="text-lg font-semibold">{data[data.length - 1]?.value.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Change</p>
          <p className={cn(
            "text-lg font-semibold",
            trend === 'up' && "text-emerald-600",
            trend === 'down' && "text-red-600",
            trend === 'stable' && "text-gray-600"
          )}>
            {data.length > 1 
              ? `${((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1)}%`
              : '0%'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
