'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/lib/pwa/serviceWorker';
import { AddToHomeScreen } from './AddToHomeScreen';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Register service worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        setSwRegistered(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('[PWA] Service worker registered');
        }
      }
    });

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('[PWA] App is online');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('[PWA] App is offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      <AddToHomeScreen />
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm">
          You're offline. Some features may be limited.
        </div>
      )}
    </>
  );
}
