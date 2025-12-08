'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already shown (localStorage)
    const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
    const promptDismissed = localStorage.getItem('pwa-install-prompt-dismissed');

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt if not dismissed before
      if (!promptDismissed && !hasShownPrompt) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
      setShowPrompt(false);
      setIsInstalled(true);
      localStorage.setItem('pwa-installed', 'true');
    } else {
      console.log('[PWA] User dismissed install prompt');
      localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
  };

  // Don't show if already installed or on iOS (show custom instructions instead)
  if (isInstalled || isStandalone || !showPrompt) {
    if (isIOS && !isStandalone) {
      return <IOSInstallInstructions />;
    }
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto',
        'bg-gradient-to-br from-slate-900 to-slate-800',
        'border border-white/10 rounded-2xl shadow-2xl',
        'p-4 animate-slide-up',
        showPrompt ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      style={{
        transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1">
            Install ScoutPulse
          </h3>
          <p className="text-gray-400 text-xs mb-3">
            Add to your home screen for quick access and offline support
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-300 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// iOS-specific install instructions
function IOSInstallInstructions() {
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const hasShownIOSInstructions = localStorage.getItem('pwa-ios-instructions-shown');
    if (!hasShownIOSInstructions) {
      setTimeout(() => setShowInstructions(true), 5000);
    }
  }, []);

  if (!showInstructions) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto',
        'bg-gradient-to-br from-slate-900 to-slate-800',
        'border border-white/10 rounded-2xl shadow-2xl',
        'p-4 animate-slide-up'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-2">
            Install ScoutPulse on iOS
          </h3>
          <ol className="text-gray-400 text-xs space-y-2 mb-3 list-decimal list-inside">
            <li>Tap the Share button <span className="text-white">(□↑)</span> at the bottom</li>
            <li>Scroll down and tap <span className="text-white">"Add to Home Screen"</span></li>
            <li>Tap <span className="text-white">"Add"</span> in the top right</li>
          </ol>
          
          <button
            onClick={() => {
              setShowInstructions(false);
              localStorage.setItem('pwa-ios-instructions-shown', 'true');
            }}
            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors duration-300 min-h-[44px]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
