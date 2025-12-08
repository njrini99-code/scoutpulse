'use client';

/**
 * PWA Implementation Summary
 * 
 * This component demonstrates all PWA features and can be used for testing.
 * Remove or hide in production.
 */

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SwipeGestures } from './SwipeGestures';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { logMobileTestingReport, DEVICE_SIZES } from '@/lib/pwa/mobileTesting';
import { isTouchDevice, getDeviceType } from '@/lib/pwa/touchTargets';

export function PWASummary() {
  const [swipeDirection, setSwipeDirection] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const pushNotifications = usePushNotifications();

  useEffect(() => {
    // Log mobile testing report
    logMobileTestingReport();

    // Get device info
    setDeviceInfo({
      isTouch: isTouchDevice(),
      deviceType: getDeviceType(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      isOnline: navigator.onLine,
    });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">PWA Features</h1>

      {/* Device Info */}
      {deviceInfo && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Device Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Touch Device:</span>
              <span className="text-white ml-2">{deviceInfo.isTouch ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Device Type:</span>
              <span className="text-white ml-2 capitalize">{deviceInfo.deviceType}</span>
            </div>
            <div>
              <span className="text-gray-400">Viewport:</span>
              <span className="text-white ml-2">
                {deviceInfo.viewport.width}x{deviceInfo.viewport.height}
              </span>
            </div>
            <div>
              <span className="text-gray-400">PWA Installed:</span>
              <span className="text-white ml-2">{deviceInfo.isPWA ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Online:</span>
              <span className="text-white ml-2">{deviceInfo.isOnline ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Push Notifications</h2>
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            Permission: <span className="text-white capitalize">{pushNotifications.permission}</span>
          </div>
          <div className="text-sm text-gray-400">
            Subscribed: <span className="text-white">{pushNotifications.isSubscribed ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex gap-2">
            <TouchOptimizedButton
              variant="primary"
              onClick={() => pushNotifications.subscribe()}
              disabled={pushNotifications.isLoading || pushNotifications.isSubscribed}
            >
              Subscribe
            </TouchOptimizedButton>
            <TouchOptimizedButton
              variant="secondary"
              onClick={() => pushNotifications.unsubscribe()}
              disabled={pushNotifications.isLoading || !pushNotifications.isSubscribed}
            >
              Unsubscribe
            </TouchOptimizedButton>
          </div>
        </div>
      </div>

      {/* Swipe Gestures */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Swipe Gestures</h2>
        <p className="text-sm text-gray-400 mb-4">
          Swipe in any direction on the box below:
        </p>
        <SwipeGestures
          onSwipeLeft={() => setSwipeDirection('Left')}
          onSwipeRight={() => setSwipeDirection('Right')}
          onSwipeUp={() => setSwipeDirection('Up')}
          onSwipeDown={() => setSwipeDirection('Down')}
          className="p-8 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center min-h-[200px] flex items-center justify-center"
        >
          <div>
            <p className="text-white text-lg mb-2">Swipe here</p>
            {swipeDirection && (
              <p className="text-emerald-400 text-2xl font-bold">
                Swiped {swipeDirection}!
              </p>
            )}
          </div>
        </SwipeGestures>
      </div>

      {/* Touch Targets */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Touch-Optimized Buttons</h2>
        <p className="text-sm text-gray-400 mb-4">
          All buttons meet the 44x44px minimum touch target size:
        </p>
        <div className="flex flex-wrap gap-4">
          <TouchOptimizedButton variant="primary" size="sm">
            Small
          </TouchOptimizedButton>
          <TouchOptimizedButton variant="primary" size="md">
            Medium
          </TouchOptimizedButton>
          <TouchOptimizedButton variant="primary" size="lg">
            Large
          </TouchOptimizedButton>
        </div>
      </div>

      {/* Device Sizes */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Supported Device Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {DEVICE_SIZES.map((device) => (
            <div key={device.name} className="p-2 bg-white/5 rounded">
              <div className="font-medium text-white">{device.name}</div>
              <div className="text-gray-400">
                {device.width}x{device.height}px
              </div>
              <div className="text-gray-500 text-xs capitalize">{device.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
