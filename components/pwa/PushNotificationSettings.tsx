'use client';

import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { cn } from '@/lib/utils';

export function PushNotificationSettings() {
  const {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-400">
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold mb-1">Push Notifications</h3>
          <p className="text-sm text-gray-400">
            Get notified about new messages and coach interest
          </p>
        </div>
        <TouchOptimizedButton
          variant={isSubscribed ? 'secondary' : 'primary'}
          onClick={handleToggle}
          disabled={isLoading || permission !== 'granted'}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
            </span>
          ) : isSubscribed ? (
            <span className="flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              Disable
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Enable
            </span>
          )}
        </TouchOptimizedButton>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isSubscribed && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-400">
            ✓ Push notifications are enabled
          </p>
        </div>
      )}
    </div>
  );
}
