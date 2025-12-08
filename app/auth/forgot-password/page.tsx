'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      logError(error, { component: 'ForgotPasswordPage', action: 'handleSubmit' });
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 mb-6">
              We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setSent(false)}
                variant="outline"
                className="w-full"
              >
                Try another email
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-white inline-block mb-2">
              Scout<span className="text-blue-500">Pulse</span>
            </Link>
            <p className="text-slate-400">Reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="text-sm text-slate-500">
                Enter the email associated with your account and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant="gradient"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send reset link
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-400">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

