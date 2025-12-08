'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, MessageSquare, Users, Video, BarChart3, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'profile_view' | 'message' | 'watchlist_add' | 'stat_update' | 'video_upload';
  actorName: string;
  actorId: string;
  targetName?: string;
  targetId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ActivityGroup {
  type: string;
  count: number;
  activities: Activity[];
  latest: Date;
}

export function ActivityFeed({ userId, userRole }: { userId?: string; userRole?: 'coach' | 'player' }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groupedActivities, setGroupedActivities] = useState<ActivityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadActivities();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = userId || user.id;

      const { data: activityData } = await supabase
        .from('activities')
        .select('*')
        .or(`target_user_id.eq.${targetUserId},actor_user_id.eq.${targetUserId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityData) {
        const mapped = activityData.map(a => ({
          id: a.id,
          type: a.activity_type,
          actorName: a.actor_name || 'Someone',
          actorId: a.actor_user_id,
          targetName: a.target_name,
          targetId: a.target_user_id,
          timestamp: new Date(a.created_at),
          metadata: a.metadata
        }));

        setActivities(mapped);
        groupActivities(mapped);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  };

  const groupActivities = (acts: Activity[]) => {
    const groups = new Map<string, ActivityGroup>();

    acts.forEach(activity => {
      const key = `${activity.type}_${activity.actorId}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          type: activity.type,
          count: 0,
          activities: [],
          latest: activity.timestamp
        });
      }

      const group = groups.get(key)!;
      group.count++;
      group.activities.push(activity);
      if (activity.timestamp > group.latest) {
        group.latest = activity.timestamp;
      }
    });

    setGroupedActivities(
      Array.from(groups.values())
        .sort((a, b) => b.latest.getTime() - a.latest.getTime())
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'profile_view':
        return <Eye className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'watchlist_add':
        return <Users className="w-4 h-4" />;
      case 'stat_update':
        return <BarChart3 className="w-4 h-4" />;
      case 'video_upload':
        return <Video className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getActivityMessage = (group: ActivityGroup): string => {
    const activity = group.activities[0];
    
    if (group.count > 1) {
      switch (group.type) {
        case 'profile_view':
          return `${group.count} coaches viewed your profile`;
        case 'watchlist_add':
          return `${group.count} players added to watchlist`;
        case 'stat_update':
          return `${group.count} players updated their stats`;
        default:
          return `${group.count} activities`;
      }
    }

    switch (group.type) {
      case 'profile_view':
        return `${activity.actorName} viewed your profile`;
      case 'message':
        return `New message from ${activity.actorName}`;
      case 'watchlist_add':
        return `${activity.actorName} added you to watchlist`;
      case 'stat_update':
        return `${activity.targetName || 'A player'} updated their stats`;
      case 'video_upload':
        return `${activity.targetName || 'A player'} uploaded a new video`;
      default:
        return 'New activity';
    }
  };

  if (loading) {
    return <div className="p-4">Loading activities...</div>;
  }

  if (groupedActivities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Stream</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {groupedActivities.map((group, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getActivityIcon(group.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{getActivityMessage(group)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(group.latest, { addSuffix: true })}
                </p>
                {group.count > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.activities.map(a => a.actorName).slice(0, 3).join(', ')}
                    {group.count > 3 && ` and ${group.count - 3} more`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
