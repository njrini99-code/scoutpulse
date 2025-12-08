'use client';

import { useCurrentPlayer } from '@/lib/hooks/useCurrentPlayer';
import { PlayerEventsFilters } from '@/components/player/dashboard/Events/player-events-filters';
import { PlayerEventsTimeline } from '@/components/player/dashboard/Events/player-events-timeline';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { Card } from '@/components/ui/card';
import { getPlayerEventsTimeline, type EventFilter, type PlayerEventTimelineItem } from '@/lib/api/player/getPlayerEventsTimeline';

export default function PlayerEventsPage() {
  const { player, isLoading: loadingPlayer, error } = useCurrentPlayer();
  const [filters, setFilters] = useState<EventFilter>({ type: 'all', range: { from: null, to: null } });
  const [items, setItems] = useState<PlayerEventTimelineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player) return;
    
    const loadEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await getPlayerEventsTimeline(player.id, filters);
        setItems(eventsData);
      } catch (error) {
        logError(error, { component: 'PlayerEventsPage', action: 'loadEvents' });
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
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
      <PlayerEventsFilters value={filters} onChange={setFilters} />
      <PlayerEventsTimeline items={items} loading={loading} />
    </div>
  );
}
