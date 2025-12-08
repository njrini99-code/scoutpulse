'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';

interface TestResult {
  accessible: boolean;
  error: string | null;
  resultCount?: number;
}

interface TestResults {
  timestamp: string;
  tests: Record<string, TestResult>;
  success: boolean;
  errors: string[];
  environment?: {
    hasUrl: boolean;
    hasKey: boolean;
    urlPreview: string;
  };
}

export default function TestDBPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResults(data);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-blue-500/20 rounded animate-pulse mx-auto" />
          <p className="text-slate-400">Testing database connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-red-500/50 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Connection Error</h2>
            </div>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) return null;

  const testEntries = Object.entries(results.tests || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Database Connection Test</h1>
          </div>
          <p className="text-slate-400">
            Testing connection to your Supabase database
          </p>
        </div>

        {/* Overall Status */}
        <Card className={`bg-slate-900/50 border-2 ${
          results.success 
            ? 'border-emerald-500/50' 
            : 'border-red-500/50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {results.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {results.success ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {results.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={testConnection}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                Run Again
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Check */}
        {results.environment && (
          <Card className="bg-slate-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Environment Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {results.environment.hasUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-slate-300">
                  NEXT_PUBLIC_SUPABASE_URL: {results.environment.urlPreview}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {results.environment.hasKey ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-slate-300">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY: {results.environment.hasKey ? 'Set' : 'Missing'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Table & Function Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testEntries.map(([name, result]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    {result.accessible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <span className="font-medium text-white capitalize">
                        {name.replace(/_/g, ' ')}
                      </span>
                      {result.resultCount !== undefined && (
                        <span className="text-sm text-slate-400 ml-2">
                          ({result.resultCount} results)
                        </span>
                      )}
                    </div>
                  </div>
                  {result.error && (
                    <span className="text-xs text-red-400 max-w-md truncate">
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {results.errors.length > 0 && (
          <Card className="bg-red-950/20 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-lg text-red-400">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {results.errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-300">• {err}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {results.success && (
          <Card className="bg-emerald-950/20 border-emerald-500/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">Database is Ready! 🎉</h3>
                <p className="text-slate-300">
                  All tables and functions are accessible. You can now start using the app!
                </p>
                <div className="pt-4 space-y-2">
                  <a
                    href="/"
                    className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Go to Home
                  </a>
                  <a
                    href="/auth/signup"
                    className="inline-block px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors ml-3"
                  >
                    Try Signup
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

