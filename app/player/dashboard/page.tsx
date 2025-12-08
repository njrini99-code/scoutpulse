'use client';

import { PlayerOverviewHero } from '@/components/player/dashboard/Overview/player-overview-hero';
import { PlayerOverviewQuickStats } from '@/components/player/dashboard/Overview/player-overview-quick-stats';
import { PlayerOverviewRecentGames } from '@/components/player/dashboard/Overview/player-overview-recent-games';
import { PlayerOverviewShowcaseHighlight } from '@/components/player/dashboard/Overview/player-overview-showcase-highlight';
import { useCurrentPlayer } from '@/lib/hooks/useCurrentPlayer';
import { Card } from '@/components/ui/card';

export default function PlayerOverviewPage() {
  const { player, profile, isLoading, error } = useCurrentPlayer();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !player || !profile) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-6 text-white">
        <p className="text-sm text-slate-300">We could not load your profile yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PlayerOverviewHero player={player} profile={profile} />
      <div className="grid gap-6 md:grid-cols-2">
        <PlayerOverviewQuickStats playerId={player.id} />
        <PlayerOverviewShowcaseHighlight playerId={player.id} />
      </div>
      <PlayerOverviewRecentGames playerId={player.id} />
    </div>
  );
}
