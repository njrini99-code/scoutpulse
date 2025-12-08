'use client';

import { useEffect, useState } from 'react';
import {
  AlertOctagon,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bug,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR PAGE
// Handles errors in the root layout
// ═══════════════════════════════════════════════════════════════════════════

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[GlobalError] Critical application error:', error);
  }, [error]);

  const handleCopyError = async () => {
    const errorText = `
Critical Error: ${error.name || 'Error'}
Message: ${error.message}
${error.digest ? `Digest: ${error.digest}` : ''}
${error.stack ? `\nStack Trace:\n${error.stack}` : ''}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Time: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Critical Error | ScoutPulse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1e2e 50%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            color: white;
          }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .container {
            animation: fade-in 0.5s ease-out;
            max-width: 480px;
            width: 100%;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          
          .header {
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .icon-container {
            display: inline-flex;
            padding: 1.25rem;
            background: rgba(239, 68, 68, 0.2);
            border-radius: 16px;
            margin-bottom: 1.5rem;
            animation: pulse 2s ease-in-out infinite, shake 0.5s ease-in-out;
          }
          
          .icon {
            width: 48px;
            height: 48px;
            color: #f87171;
          }
          
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          
          .subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.95rem;
            line-height: 1.5;
          }
          
          .error-box {
            margin: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
          }
          
          .error-header {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .error-icon {
            width: 20px;
            height: 20px;
            color: #f87171;
            flex-shrink: 0;
            margin-top: 2px;
          }
          
          .error-content {
            flex: 1;
            min-width: 0;
          }
          
          .error-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #f87171;
          }
          
          .error-message {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 0.25rem;
            word-break: break-word;
          }
          
          .error-digest {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 0.5rem;
            font-family: monospace;
          }
          
          .copy-btn {
            padding: 0.5rem;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.2s;
          }
          
          .copy-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          
          .copy-icon {
            width: 16px;
            height: 16px;
            color: rgba(255, 255, 255, 0.4);
          }
          
          .copy-icon.success {
            color: #34d399;
          }
          
          .details-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.75rem 1rem;
            margin: 0 1rem;
            margin-top: 0.5rem;
            background: transparent;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.875rem;
            transition: background 0.2s;
            box-sizing: border-box;
            width: calc(100% - 2rem);
          }
          
          .details-toggle:hover {
            background: rgba(255, 255, 255, 0.05);
          }
          
          .details-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .chevron {
            width: 16px;
            height: 16px;
          }
          
          .stack-trace {
            margin: 0 1rem 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
          }
          
          .stack-trace pre {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
            font-family: monospace;
            max-height: 200px;
            overflow-y: auto;
          }
          
          .actions {
            padding: 1.5rem;
          }
          
          .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .btn-icon {
            width: 20px;
            height: 20px;
          }
          
          .btn-primary {
            background: #10b981;
            color: white;
            margin-bottom: 0.75rem;
          }
          
          .btn-primary:hover {
            background: #059669;
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
          }
          
          .btn-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          
          .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
          }
          
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }
          
          .footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            text-align: center;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
          }
          
          .dev-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1.5rem;
            padding: 0.5rem 1rem;
            background: rgba(245, 158, 11, 0.2);
            border-radius: 9999px;
            font-size: 0.75rem;
            color: #fbbf24;
          }
          
          .dev-dot {
            width: 8px;
            height: 8px;
            background: #fbbf24;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="header">
              <div className="icon-container">
                <AlertOctagon className="icon" />
              </div>
              <h1>Critical Error</h1>
              <p className="subtitle">
                The application encountered a critical error and couldn&apos;t recover.
                Please try reloading the page.
              </p>
            </div>

            <div className="error-box">
              <div className="error-header">
                <Bug className="error-icon" />
                <div className="error-content">
                  <p className="error-name">{error.name || 'Error'}</p>
                  <p className="error-message">{error.message || 'An unexpected error occurred'}</p>
                  {error.digest && (
                    <p className="error-digest">ID: {error.digest}</p>
                  )}
                </div>
                <button onClick={handleCopyError} className="copy-btn" title="Copy error">
                  {copied ? (
                    <Check className="copy-icon success" />
                  ) : (
                    <Copy className="copy-icon" />
                  )}
                </button>
              </div>
            </div>

            {isDev && error.stack && (
              <>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="details-toggle"
                >
                  <span className="details-label">
                    <Bug style={{ width: 16, height: 16 }} />
                    Stack Trace
                  </span>
                  {showDetails ? (
                    <ChevronUp className="chevron" />
                  ) : (
                    <ChevronDown className="chevron" />
                  )}
                </button>

                {showDetails && (
                  <div className="stack-trace">
                    <pre>{error.stack}</pre>
                  </div>
                )}
              </>
            )}

            <div className="actions">
              <button onClick={reset} className="btn btn-primary">
                <RefreshCw className="btn-icon" />
                Try Again
              </button>
              <div className="btn-grid">
                <button onClick={handleReload} className="btn btn-secondary">
                  <RefreshCw className="btn-icon" />
                  Reload
                </button>
                <button onClick={handleGoHome} className="btn btn-secondary">
                  <Home className="btn-icon" />
                  Home
                </button>
              </div>
            </div>

            <div className="footer">
              {new Date().toLocaleTimeString()} · {error.digest?.slice(0, 8) || 'GLOBAL-ERR'}
            </div>
          </div>

          {isDev && (
            <div style={{ textAlign: 'center' }}>
              <span className="dev-badge">
                <span className="dev-dot" />
                Development Mode
              </span>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
