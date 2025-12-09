'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

// Lazy load providers that use browser APIs
const ThemeProvider = dynamic(() => import('@/lib/theme-context').then(mod => ({ default: mod.ThemeProvider })), { ssr: false });
const ErrorProvider = dynamic(() => import('@/components/providers/ErrorProvider').then(mod => ({ default: mod.ErrorProvider })), { ssr: false });
const AnimationProvider = dynamic(() => import('@/components/providers/AnimationProvider').then(mod => ({ default: mod.AnimationProvider })), { ssr: false });
const PWAProvider = dynamic(() => import('@/components/pwa/PWAProvider').then(mod => ({ default: mod.PWAProvider })), { ssr: false });

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <ErrorProvider>
        <AnimationProvider>
          <PWAProvider>
            {children}
          </PWAProvider>
        </AnimationProvider>
      </ErrorProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-slate-700 text-slate-800 dark:text-white',
          },
        }}
      />
    </ThemeProvider>
  );
}
