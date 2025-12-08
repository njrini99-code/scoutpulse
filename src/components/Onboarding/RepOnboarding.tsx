import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface RepOnboardingProps {
  onComplete: () => void;
}

export function RepOnboarding({ onComplete }: RepOnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'welcome' | 'leads' | 'newbiz' | 'complete'>('welcome');
  const [leadsFile, setLeadsFile] = useState<File | null>(null);
  const [newBizFile, setNewBizFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [leadsStatus, setLeadsStatus] = useState<'pending' | 'success' | 'skipped'>('pending');
  const [newBizStatus, setNewBizStatus] = useState<'pending' | 'success' | 'skipped'>('pending');
  const [error, setError] = useState('');

  const handleLeadsUpload = async () => {
    if (!leadsFile) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const text = await leadsFile.text();
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newbiz-ingest-csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csv_text: text }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setLeadsStatus('success');
        setTimeout(() => setStep('newbiz'), 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleNewBizUpload = async () => {
    if (!newBizFile) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const text = await newBizFile.text();
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newbiz-ingest-csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csv_text: text }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setNewBizStatus('success');
        setTimeout(() => setStep('complete'), 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const skipLeads = () => {
    setLeadsStatus('skipped');
    setStep('newbiz');
  };

  const skipNewBiz = () => {
    setNewBizStatus('skipped');
    setStep('complete');
  };

  const completeOnboarding = async () => {
    await supabase
      .from('user_settings')
      .update({ onboarding_completed: true })
      .eq('user_id', user?.id);

    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {step === 'welcome' && (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Tempo!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Let's get you set up by importing your territory data. This will help you hit the ground running.
            </p>
            <button
              onClick={() => setStep('leads')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 'leads' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Import Your Leads</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV file containing your existing leads and territory data.
            </p>

            <div className="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setLeadsFile(e.target.files[0]);
                    setError('');
                  }
                }}
                className="hidden"
                id="leads-upload"
              />
              <label
                htmlFor="leads-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Choose CSV file
              </label>
              {leadsFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {leadsFile.name}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleLeadsUpload}
                disabled={!leadsFile || uploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Leads'}
              </button>
              <button
                onClick={skipLeads}
                disabled={uploading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 'newbiz' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Import New Businesses</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV file containing new businesses in your territory.
            </p>

            <div className="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setNewBizFile(e.target.files[0]);
                    setError('');
                  }
                }}
                className="hidden"
                id="newbiz-upload"
              />
              <label
                htmlFor="newbiz-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Choose CSV file
              </label>
              {newBizFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {newBizFile.name}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleNewBizUpload}
                disabled={!newBizFile || uploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload New Businesses'}
              </button>
              <button
                onClick={skipNewBiz}
                disabled={uploading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">All Set!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your account is ready. Let's start building your day.
            </p>
            <button
              onClick={completeOnboarding}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          <div className={`h-2 w-2 rounded-full ${step === 'welcome' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 'leads' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 'newbiz' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 'complete' ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>
      </div>
    </div>
  );
}
