'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type GameStat = {
  id: string;
  date: string;
  opponent: string;
  stats: string;
};

export function PlayerOverviewRecentGames({ playerId }: { playerId: string }) {
  const [recentActivity, setRecentActivity] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, [playerId]);

  const loadRecentActivity = async () => {
    const supabase = createClient();

    // Check for recent video uploads or metrics updates as "game activity"
    const { data: videos } = await supabase
      .from('player_videos')
      .select('id, title, recorded_date, video_type')
      .eq('player_id', playerId)
      .order('recorded_date', { ascending: false })
      .limit(3);

    if (videos && videos.length > 0) {
      const activity: GameStat[] = videos.map(v => ({
        id: v.id,
        date: v.recorded_date || new Date().toISOString(),
        opponent: v.title,
        stats: v.video_type
      }));
      setRecentActivity(activity);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">Recent activity</p>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-24"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (recentActivity.length === 0) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">Recent activity</p>
          <Link href="/player/profile" className="text-xs text-emerald-300 hover:text-emerald-200">
            Add content
          </Link>
        </div>
        <div className="py-8 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full mx-auto mb-3 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 mb-1">No recent activity</p>
          <p className="text-xs text-slate-500">Upload videos or add stats to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-300">Recent activity</p>
        <Link href="/player/profile" className="text-xs text-emerald-300 hover:text-emerald-200">
          View all
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.opponent}</p>
                <p className="text-[12px] text-slate-400">
                  {formatDate(activity.date)} • {activity.stats}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
