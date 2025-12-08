'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { ArrowLeft, Loader2, Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError('Invalid or expired reset link. Please request a new one.');
        }
      } catch (err) {
        logError(err, { component: 'ResetPasswordPage', action: 'checkSession' });
        setError('Something went wrong. Please try again.');
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      logError(err, { component: 'ResetPasswordPage', action: 'handleSubmit' });
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 bg-blue-500/20 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Link expired</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <Link href="/auth/forgot-password">
              <Button variant="gradient" className="w-full">
                Request new reset link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
            <p className="text-slate-400 mb-6">
              Your password has been reset successfully. Redirecting you to login...
            </p>
            <div className="w-6 h-6 bg-blue-500/20 rounded animate-pulse mx-auto" />
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
            <p className="text-slate-400">Set your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
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
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Update password
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

