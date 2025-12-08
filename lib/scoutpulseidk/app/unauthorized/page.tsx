'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldX,
  Home,
  ArrowLeft,
  LogIn,
  RefreshCw,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

type UnauthorizedReason = 'role' | 'session_expired' | 'not_authenticated' | 'coach_type' | 'unknown';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const reason = (searchParams.get('reason') as UnauthorizedReason) || 'unknown';
  const returnUrl = searchParams.get('return') || '/';
  const requiredRole = searchParams.get('required_role');
  const userRole = searchParams.get('user_role');

  // Auto-redirect countdown for expired sessions
  useEffect(() => {
    if (reason === 'session_expired' && autoRedirect && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [reason, autoRedirect, countdown]);

  // Redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && reason === 'session_expired') {
      router.push('/auth/login?redirect=' + encodeURIComponent(returnUrl));
    }
  }, [countdown, reason, returnUrl, router]);

  const getReasonContent = () => {
    switch (reason) {
      case 'session_expired':
        return {
          icon: Clock,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10',
          title: 'Session Expired',
          description: 'Your session has expired for security reasons. Please log in again to continue.',
          badge: { text: 'Session Timeout', color: 'bg-amber-500/20 text-amber-400' },
          showCountdown: true,
        };
      case 'not_authenticated':
        return {
          icon: LogIn,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10',
          title: 'Authentication Required',
          description: 'You need to be logged in to access this page. Please sign in to continue.',
          badge: { text: 'Login Required', color: 'bg-blue-500/20 text-blue-400' },
          showCountdown: false,
        };
      case 'role':
        return {
          icon: ShieldX,
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/10',
          title: 'Access Denied',
          description: `This page requires ${requiredRole ? `a "${requiredRole}" role` : 'different permissions'}. ${userRole ? `Your current role is "${userRole}".` : ''}`,
          badge: { text: 'Insufficient Permissions', color: 'bg-red-500/20 text-red-400' },
          showCountdown: false,
        };
      case 'coach_type':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
          iconBg: 'bg-orange-500/10',
          title: 'Wrong Coach Type',
          description: 'This page is restricted to a specific coach type. You may need to switch to a different dashboard.',
          badge: { text: 'Coach Type Mismatch', color: 'bg-orange-500/20 text-orange-400' },
          showCountdown: false,
        };
      default:
        return {
          icon: ShieldX,
          iconColor: 'text-slate-400',
          iconBg: 'bg-slate-500/10',
          title: 'Access Denied',
          description: 'You don\'t have permission to access this page. This could be due to an expired session or insufficient permissions.',
          badge: { text: 'Unauthorized', color: 'bg-slate-500/20 text-slate-400' },
          showCountdown: false,
        };
    }
  };

  const content = getReasonContent();
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0d1117] to-[#111] text-white flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardContent className="p-8">
            {/* Icon & Badge */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`p-4 rounded-2xl ${content.iconBg} mb-4`}>
                <Icon className={`w-12 h-12 ${content.iconColor}`} />
              </div>
              <Badge className={content.badge.color}>
                {content.badge.text}
              </Badge>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-3">
                {content.title}
              </h1>
              <p className="text-slate-400 leading-relaxed">
                {content.description}
              </p>
            </div>

            {/* Countdown for expired sessions */}
            {content.showCountdown && autoRedirect && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-sm text-amber-400">
                      Redirecting to login in {countdown}s...
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoRedirect(false)}
                    className="text-amber-400 hover:text-amber-300 h-7 px-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {reason === 'session_expired' || reason === 'not_authenticated' ? (
                <Link href={`/auth/login?redirect=${encodeURIComponent(returnUrl)}`} className="block">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              )}

              <Link href="/" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white gap-2"
                >
                  <Home className="w-4 h-4" />
                  Return Home
                </Button>
              </Link>
            </div>

            {/* Help Link */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <a 
                href="mailto:support@scoutpulse.com"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Need help? Contact Support
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs text-slate-500">
            <p><strong>Debug Info:</strong></p>
            <p>Reason: {reason}</p>
            <p>Return URL: {returnUrl}</p>
            {requiredRole && <p>Required Role: {requiredRole}</p>}
            {userRole && <p>User Role: {userRole}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
