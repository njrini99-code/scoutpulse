'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorLogger';
import { Bell, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/GlassCard';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logError(error, { component: 'NotificationsPage', action: 'fetchNotifications' });
        toast.error('Failed to load notifications');
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      logError(error, { component: 'NotificationsPage', action: 'fetchNotifications', metadata: { unexpected: true } });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        toast.error('Failed to mark as read');
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      logError(error, { component: 'NotificationsPage', action: 'markAsRead' });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        toast.error('Failed to mark all as read');
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      logError(error, { component: 'NotificationsPage', action: 'markAllAsRead' });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        toast.error('Failed to delete notification');
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      logError(error, { component: 'NotificationsPage', action: 'handleDelete' });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#0b1720] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-white/60">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="mb-4">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#00C27A] hover:bg-[#00A565] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-white/30" />
            <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-white/60">When you receive notifications, they'll appear here</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <GlassCard
                key={notification.id}
                className={`p-4 hover:bg-white/[0.08] transition-colors ${
                  !notification.is_read ? 'border-[#00C27A]/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 mt-2 bg-[#00C27A] rounded-full flex-shrink-0" />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-white font-medium">{notification.title}</h3>
                      <span className="text-white/40 text-sm whitespace-nowrap">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{notification.message}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="text-[#00C27A] hover:text-[#00A565] text-sm font-medium"
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          View →
                        </a>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-white/60 hover:text-white text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-white/40 hover:text-red-400 text-sm flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
