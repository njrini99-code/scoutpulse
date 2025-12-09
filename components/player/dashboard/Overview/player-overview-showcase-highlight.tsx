'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

type Achievement = {
  id: string;
  title: string;
  date: string;
};

export function PlayerOverviewShowcaseHighlight({ playerId }: { playerId: string }) {
  const [latestAchievement, setLatestAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestAchievement();
  }, [playerId]);

  const loadLatestAchievement = async () => {
    const supabase = createClient();

    const { data: achievements } = await supabase
      .from('player_achievements')
      .select('id, achievement_text, achievement_date')
      .eq('player_id', playerId)
      .order('achievement_date', { ascending: false })
      .limit(1);

    if (achievements && achievements.length > 0) {
      setLatestAchievement({
        id: achievements[0].id,
        title: achievements[0].achievement_text,
        date: achievements[0].achievement_date || new Date().toISOString()
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <p className="text-sm text-slate-200">Recent achievement</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-24"></div>
        </div>
      </Card>
    );
  }

  if (!latestAchievement) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-300" />
          <p className="text-sm text-slate-200">Achievements</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center gap-2 py-6">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-400">No achievements yet</p>
          <Link href="/player/profile" className="text-xs text-emerald-300 hover:text-emerald-200 mt-1">
            Add your first
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border-white/5 p-4 text-white h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-emerald-300" />
        <p className="text-sm text-slate-200">Recent achievement</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-400/60 text-emerald-300 bg-emerald-500/10">
            Latest
          </Badge>
        </div>
        <p className="text-base font-semibold">{latestAchievement.title}</p>
        <p className="text-xs text-slate-400">{formatDate(latestAchievement.date)}</p>
      </div>
    </Card>
  );
}
