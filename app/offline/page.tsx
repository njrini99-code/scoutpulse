'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/MicroInteractions';

export default function OfflinePage() {
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">You're Offline</h1>
        <p className="text-gray-400 mb-8">
          It looks like you've lost your internet connection. Please check your network settings and try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <AnimatedButton
            variant="primary"
            size="lg"
            onClick={handleRetry}
            className="min-h-[44px] min-w-[120px]"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry
          </AnimatedButton>
          
          <Link href="/">
            <AnimatedButton
              variant="secondary"
              size="lg"
              className="min-h-[44px] min-w-[120px]"
            >
              Go Home
            </AnimatedButton>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">
            Some features may still work offline if you've visited them before.
          </p>
        </div>
      </div>
    </div>
  );
}
