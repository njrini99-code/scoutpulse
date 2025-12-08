'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, TrendingUp, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachActivity {
  coachId: string;
  coachName: string;
  school: string;
  location: string;
  viewCount: number;
  lastViewed: Date;
  tier: 'D1' | 'D2' | 'D3' | 'JUCO' | 'HS';
}

export function CoachInterestHeatmap() {
  const [activities, setActivities] = useState<CoachActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'timeline'>('list');
  const supabase = createClient();

  useEffect(() => {
    loadCoachActivity();
  }, []);

  const loadCoachActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!player) return;

      // Get profile views from coaches
      const { data: views } = await supabase
        .from('profile_views')
        .select('*, coach:coaches(id, program_name, city, state, division)')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!views) return;

      // Aggregate by coach
      const activityMap = new Map<string, CoachActivity>();
      
      views.forEach((view: any) => {
        const coachId = view.coach?.id;
        if (!coachId) return;

        if (!activityMap.has(coachId)) {
          activityMap.set(coachId, {
            coachId,
            coachName: view.coach?.program_name || 'Unknown',
            school: view.coach?.program_name || 'Unknown',
            location: `${view.coach?.city || ''}, ${view.coach?.state || ''}`.trim(),
            viewCount: 0,
            lastViewed: new Date(view.created_at),
            tier: (view.coach?.division || 'D3') as any
          });
        }

        const activity = activityMap.get(coachId)!;
        activity.viewCount++;
        if (new Date(view.created_at) > activity.lastViewed) {
          activity.lastViewed = new Date(view.created_at);
        }
      });

      setActivities(Array.from(activityMap.values())
        .sort((a, b) => b.viewCount - a.viewCount));
      setLoading(false);
    } catch (error) {
      console.error('Error loading coach activity:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading heatmap...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No coach activity yet.</p>
        <p className="text-xs mt-1">Activity will appear here as coaches view your profile.</p>
      </div>
    );
  }

  const totalViews = activities.reduce((sum, a) => sum + a.viewCount, 0);
  const uniqueCoaches = activities.length;
  const hotProspects = activities.filter(a => a.viewCount >= 3).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Coach Interest Heatmap</h3>
          <p className="text-sm text-muted-foreground">See who's viewing your profile</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'timeline' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-sm text-muted-foreground">Total Views</p>
          <p className="text-2xl font-bold">{totalViews}</p>
        </div>
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-sm text-muted-foreground">Unique Coaches</p>
          <p className="text-2xl font-bold">{uniqueCoaches}</p>
        </div>
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-sm text-muted-foreground">Hot Prospects</p>
          <p className="text-2xl font-bold text-emerald-600">{hotProspects}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.coachId}
            className={cn(
              "p-4 rounded-lg border transition-colors",
              activity.viewCount >= 3 && "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
              activity.viewCount === 2 && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20",
              activity.viewCount === 1 && "border-gray-200 dark:border-gray-800"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{activity.school}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  activity.tier === 'D1' && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                  activity.tier === 'D2' && "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                  activity.tier === 'D3' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                  "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}>
                  {activity.tier}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{activity.viewCount} views</span>
                </div>
                {activity.viewCount >= 3 && (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">High Interest</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {activity.lastViewed.toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
