'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bug,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES (Injected)
// ═══════════════════════════════════════════════════════════════════════════

const errorPageStyles = `
/* Error page animations */
@keyframes error-page-fade-in {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes error-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes error-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { opacity: 0.9; box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(2deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

.error-page-container {
  animation: error-page-fade-in 0.5s ease-out forwards;
}

.error-icon-container {
  animation: error-icon-bounce 2s ease-in-out infinite;
}

.error-icon-pulse {
  animation: error-pulse 2s ease-in-out infinite;
}

.gradient-bg {
  background: linear-gradient(-45deg, #1e293b, #0f172a, #1e1e2e, #0f172a);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}

.floating-shape {
  animation: float 6s ease-in-out infinite;
}

.floating-shape:nth-child(2) {
  animation-delay: -2s;
}

.floating-shape:nth-child(3) {
  animation-delay: -4s;
}

/* Glass effect */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-card-darker {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Button effects */
.btn-glow-red:hover {
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
}

.btn-glow-emerald:hover {
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
}

/* Copy animation */
@keyframes copy-check {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.copy-success {
  animation: copy-check 0.3s ease-out forwards;
}

/* Details expand */
@keyframes details-slide {
  0% { opacity: 0; max-height: 0; }
  100% { opacity: 1; max-height: 500px; }
}

.details-expanded {
  animation: details-slide 0.3s ease-out forwards;
  overflow: hidden;
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isDev = process.env.NODE_ENV === 'development';

  // Inject styles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('error-page-styles')) return;

    const style = document.createElement('style');
    style.id = 'error-page-styles';
    style.textContent = errorPageStyles;
    document.head.appendChild(style);
  }, []);

  // Log error
  useEffect(() => {
    console.error('[ErrorPage] Application error:', error);
  }, [error]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    reset();
  };

  const handleCopyError = async () => {
    const errorText = `
Error: ${error.name || 'Error'}
Message: ${error.message}
${error.digest ? `Digest: ${error.digest}` : ''}
${error.stack ? `\nStack Trace:\n${error.stack}` : ''}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Time: ${new Date().toISOString()}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-shape absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
        <div className="floating-shape absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="floating-shape absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="error-page-container relative z-10 w-full max-w-lg">
        {/* Main error card */}
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="error-icon-container inline-block mb-6">
              <div className="error-icon-pulse p-5 rounded-2xl bg-red-500/20 inline-block">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-white/60 max-w-sm mx-auto">
              We encountered an unexpected error while processing your request.
              Don&apos;t worry, your data is safe.
            </p>
          </div>

          {/* Error info */}
          <div className="p-4 mx-4 mt-4 rounded-xl glass-card-darker">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-400">
                  {error.name || 'Error'}
                </p>
                <p className="text-sm text-white/70 break-words mt-1">
                  {error.message || 'An unexpected error occurred'}
                </p>
                {error.digest && (
                  <p className="text-xs text-white/40 mt-2 font-mono">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
              <button
                onClick={handleCopyError}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                title="Copy error details"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400 copy-success" />
                ) : (
                  <Copy className="w-4 h-4 text-white/40 hover:text-white/60" />
                )}
              </button>
            </div>
          </div>

          {/* Development details */}
          {isDev && error.stack && (
            <div className="mx-4 mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-sm text-white/60 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Stack Trace (Development Only)
                </span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-white/40" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>

              {showDetails && (
                <div className="details-expanded">
                  <div className="p-4 rounded-xl glass-card-darker mb-4">
                    <pre className="text-xs text-white/50 overflow-x-auto whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-6 space-y-3">
            {/* Primary action - Retry */}
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all btn-glow-emerald"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
              {retryCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20">
                  {retryCount}
                </span>
              )}
            </button>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass-card hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass-card hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>
                {new Date().toLocaleTimeString()} · {error.digest?.slice(0, 8) || 'ERR'}
              </span>
              <Link
                href="/help"
                className="flex items-center gap-1 hover:text-white/60 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                Get Help
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Helpful tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/40 mb-3">Things you can try:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1.5 rounded-full glass-card text-xs text-white/60">
              Refresh the page
            </span>
            <span className="px-3 py-1.5 rounded-full glass-card text-xs text-white/60">
              Clear browser cache
            </span>
            <span className="px-3 py-1.5 rounded-full glass-card text-xs text-white/60">
              Check your connection
            </span>
          </div>
        </div>

        {/* Dev mode indicator */}
        {isDev && (
          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Development Mode
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
