'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Mail, Clock, Users, Eye, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationGroup {
  type: string;
  count: number;
  latest: Date;
  items: any[];
  icon: React.ReactNode;
  label: string;
}

export function SmartNotificationDigest() {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [digestMode, setDigestMode] = useState<'immediate' | 'hourly' | 'daily'>('hourly');
  const [lastDigest, setLastDigest] = useState<Date | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [digestMode]);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!notifications) return;

      // Group notifications
      const grouped = groupNotifications(notifications);
      setGroups(grouped);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const groupNotifications = (notifications: any[]): NotificationGroup[] => {
    const groupsMap = new Map<string, NotificationGroup>();

    notifications.forEach(notif => {
      const type = getNotificationType(notif);
      if (!groupsMap.has(type)) {
        groupsMap.set(type, {
          type,
          count: 0,
          latest: new Date(notif.created_at),
          items: [],
          icon: getNotificationIcon(type),
          label: getNotificationLabel(type)
        });
      }

      const group = groupsMap.get(type)!;
      group.count++;
      group.items.push(notif);
      if (new Date(notif.created_at) > group.latest) {
        group.latest = new Date(notif.created_at);
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => 
      b.latest.getTime() - a.latest.getTime()
    );
  };

  const getNotificationType = (notif: any): string => {
    if (notif.type?.includes('message')) return 'messages';
    if (notif.type?.includes('view') || notif.type?.includes('profile')) return 'views';
    if (notif.type?.includes('watchlist')) return 'watchlist';
    if (notif.type?.includes('event') || notif.type?.includes('calendar')) return 'events';
    return 'other';
  };

  const getNotificationIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'messages':
        return <MessageSquare className="w-4 h-4" />;
      case 'views':
        return <Eye className="w-4 h-4" />;
      case 'watchlist':
        return <Users className="w-4 h-4" />;
      case 'events':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationLabel = (type: string): string => {
    switch (type) {
      case 'messages':
        return 'New Messages';
      case 'views':
        return 'Profile Views';
      case 'watchlist':
        return 'Watchlist Updates';
      case 'events':
        return 'Upcoming Events';
      default:
        return 'Notifications';
    }
  };

  const totalUnread = groups.reduce((sum, group) => sum + group.count, 0);

  if (totalUnread === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">All caught up! No new notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Notification Digest</h3>
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
            {totalUnread}
          </span>
        </div>
        <select
          value={digestMode}
          onChange={(e) => setDigestMode(e.target.value as any)}
          className="text-sm border rounded-lg px-2 py-1"
        >
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
        </select>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.type}
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  {group.icon}
                </div>
                <div>
                  <p className="font-medium">{group.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(group.latest, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                {group.count}
              </span>
            </div>
            {group.count > 1 && (
              <p className="text-sm text-muted-foreground">
                {group.count} {group.label.toLowerCase()} in the last period
              </p>
            )}
          </div>
        ))}
      </div>

      <Button className="w-full" variant="outline">
        View All Notifications
      </Button>
    </div>
  );
}
