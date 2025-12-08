'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Search, ExternalLink } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/MicroInteractions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'pending' | 'verifying' | 'verified' | 'error'>('pending');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get email from URL params or from user session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get from session
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setEmail(user.email);
        }
      });
    }

    // Check if verification token is in URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'email') {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setStatus('verifying');
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data.user) {
        setStatus('verified');
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ScoutPulse Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/50">
            <span className="text-3xl font-bold text-white">SP</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            ScoutPulse
          </h1>
        </div>

        {/* Verification Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 animate-fade-in">
          {status === 'pending' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-gray-400">
                  We've sent a verification link to
                </p>
                {email && (
                  <p className="text-emerald-400 font-medium mt-1">{email}</p>
                )}
              </div>

              {/* Verify Button */}
              <div className="space-y-4">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    if (email) {
                      window.location.href = `mailto:${email}`;
                    }
                  }}
                  className="w-full min-h-[48px]"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Open Email App
                </AnimatedButton>

                {/* Backup Link */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">
                    Or click the verification link in your email:
                  </p>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm break-all">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>Check your inbox for the verification link</span>
                  </div>
                </div>
              </div>

              {/* Spam Instructions */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-400 mb-1">
                      Can't find the email?
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>Check your spam or junk folder</li>
                      <li>Look for emails from "ScoutPulse"</li>
                      <li>Wait a few minutes and check again</li>
                      <li>Make sure you entered the correct email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Resend Button */}
              <div className="space-y-2">
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full min-h-[44px]"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </AnimatedButton>

                {resendSuccess && (
                  <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verification email sent!
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Verifying...</h2>
                <p className="text-gray-400">Please wait while we verify your email</p>
              </div>
            </div>
          )}

          {status === 'verified' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                <p className="text-gray-400">Your email has been successfully verified</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                <p className="text-gray-400 mb-4">{error || 'The verification link is invalid or has expired'}</p>
                <div className="space-y-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full min-h-[44px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </AnimatedButton>
                  <Link href="/auth/login">
                    <AnimatedButton
                      variant="secondary"
                      size="md"
                      className="w-full min-h-[44px]"
                    >
                      Back to Login
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Link */}
        <div className="text-center mt-6">
          <Link
            href="/support"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Need help? Contact Support
          </Link>
        </div>
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

        .animate-fade-in {
          animation: fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
