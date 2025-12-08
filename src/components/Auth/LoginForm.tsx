import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Check, X, User, Users, Mail, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isStrong: boolean;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'rep' | 'manager'>('rep');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const { signIn, signUp } = useAuth();

  const resendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Confirmation email sent! Please check your inbox.');
      setShowResendConfirmation(false);
    }
    setLoading(false);
  };

  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    return {
      hasMinLength: pwd.length >= 12,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
      isStrong: pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)
    };
  };

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!passwordStrength.isStrong) {
        setError('Please meet all password requirements before signing up.');
        return;
      }
    }

    setLoading(true);

    if (isSignUp) {
      console.log('[SignUp] Starting signup process for:', email);

      // Pass user metadata to be stored in auth.users and trigger will create user_settings
      const { data, error: authError } = await signUp(email, password, {
        user_role: role,
        full_name: fullName.trim()
      });

      console.log('[SignUp] Response:', { data, error: authError });

      if (authError) {
        console.error('[SignUp] Auth error:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('[SignUp] User created:', data.user.id);
        console.log('[SignUp] Metadata passed:', { user_role: role, full_name: fullName.trim() });
        console.log('[SignUp] Database trigger will create user_settings automatically');
        console.log('[SignUp] User is auto-confirmed and signed in');
      }
    } else {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        // Provide user-friendly error messages
        const errorMessage = authError.message.toLowerCase();
        if (errorMessage.includes('email not confirmed') || errorMessage.includes('email_confirmed_at')) {
          setError('Please check your email and click the confirmation link before signing in.');
          setShowResendConfirmation(true);
        } else if (errorMessage.includes('invalid login') || errorMessage.includes('invalid credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(authError.message);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-100 rounded-full -ml-12 -mb-12 opacity-50"></div>

        {/* Logo */}
        <div className="flex justify-center mb-6 relative">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-5 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            TEMPO
          </h1>
          <p className="text-gray-600 font-medium">Sales CRM & Route Planner</p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Performance</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            {isSignUp && password && (
              <div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded-lg">
                <PasswordRequirement met={passwordStrength.hasMinLength} text="At least 12 characters" />
                <PasswordRequirement met={passwordStrength.hasUppercase} text="One uppercase letter" />
                <PasswordRequirement met={passwordStrength.hasLowercase} text="One lowercase letter" />
                <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                <PasswordRequirement met={passwordStrength.hasSpecial} text="One special character" />
              </div>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('rep')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    role === 'rep'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${
                    role === 'rep' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm font-semibold ${
                    role === 'rep' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Sales Rep
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Field sales</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    role === 'manager'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${
                    role === 'manager' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm font-semibold ${
                    role === 'manager' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Manager
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Team lead</div>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-4 rounded-xl">
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {showResendConfirmation && (
                <button
                  onClick={resendConfirmation}
                  disabled={loading}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold underline disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 text-sm p-4 rounded-xl flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-green-600" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
          <X className="w-3 h-3 text-gray-400" />
        </div>
      )}
      <span className={met ? 'text-green-700 font-medium' : 'text-gray-600'}>{text}</span>
    </div>
  );
}
