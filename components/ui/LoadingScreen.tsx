'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  variant?: 'fullscreen' | 'inline';
  className?: string;
}

export function LoadingScreen({
  message = 'Loading...',
  progress,
  showProgress = false,
  variant = 'fullscreen',
  className,
}: LoadingScreenProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (showProgress && progress !== undefined) {
      // Animate progress smoothly
      const duration = 300; // 300ms for consistency
      const startProgress = animatedProgress;
      const endProgress = progress;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progressRatio, 3); // ease-out cubic
        const currentProgress = startProgress + (endProgress - startProgress) * easeOut;

        setAnimatedProgress(currentProgress);

        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [progress, showProgress]);

  const containerClass = variant === 'fullscreen' 
    ? 'fixed inset-0 z-50 flex items-center justify-center'
    : 'flex items-center justify-center min-h-[400px]';

  return (
    <div className={cn(
      containerClass,
      'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      className
    )}>
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        {/* ScoutPulse Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-logo-pulse">
            <span className="text-3xl font-bold text-white">SP</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400/60 animate-ping" />
          <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-cyan-400/40 blur-xl animate-pulse" />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            ScoutPulse
          </h1>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${animatedProgress}%`,
                transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }

        .animate-fade-in {
          animation: fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-logo-pulse {
          animation: logo-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
