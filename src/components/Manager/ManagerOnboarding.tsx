import { useState } from 'react';
import { Building2, MapPin, Users, Key, ArrowRight, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ManagerOnboardingProps {
  onComplete: () => void;
}

export function ManagerOnboarding({ onComplete }: ManagerOnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    locationNumber: '',
    city: '',
    state: '',
    zipCode: '',
    additionalCredentials: '',
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!formData.teamName.trim() || !formData.locationNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      let teamData = null;
      let attempts = 0;
      const maxAttempts = 5;

      // Retry logic for unique team code
      let generatedCode = '';
      while (!teamData && attempts < maxAttempts) {
        attempts++;
        generatedCode = generateTeamCode();

        const { data, error: teamError } = await supabase
          .from('teams')
          .insert({
            team_code: generatedCode,
            team_name: formData.teamName,
            manager_id: user?.id,
          })
          .select()
          .single();

        if (!teamError) {
          teamData = data;
          setTeamCode(generatedCode);
          break;
        }

        // If unique constraint violation, retry
        if (teamError.code === '23505' && attempts < maxAttempts) {
          console.log(`Team code collision, retrying... (${attempts}/${maxAttempts})`);
          continue;
        }

        // Other errors, throw
        if (teamError) throw teamError;
      }

      if (!teamData) {
        throw new Error('Failed to generate unique team code after multiple attempts');
      }

      // Update user_settings with team info
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          team_code: generatedCode,
          is_manager: true,
        })
        .eq('user_id', user?.id);

      if (settingsError) throw settingsError;

      // Store additional manager data
      const { error: managerError } = await supabase
        .from('manager_profiles')
        .insert({
          user_id: user?.id,
          team_id: teamData.id,
          location_number: formData.locationNumber,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          credentials: formData.additionalCredentials,
        });

      if (managerError) {
        console.error('Error creating manager profile:', managerError);
      }

      setLoading(false);
      setStep(4);
    } catch (error) {
      console.error('Error during onboarding:', error);
      alert('Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
            <p className="text-center text-sm text-gray-600">
              Step {step} of 3: {step === 1 ? 'Team Details' : step === 2 ? 'Location Info' : 'Review'}
            </p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Manager!</h1>
            <p className="text-gray-600">Let's set up your team in just a few steps</p>
          </div>

          {/* Step 1: Team Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  placeholder="e.g., East Coast Sales Team"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">This will be visible to your team members</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  Location Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.locationNumber}
                  onChange={(e) => setFormData({ ...formData, locationNumber: e.target.value })}
                  placeholder="e.g., LOC-001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Your office or territory identifier</p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.teamName.trim() || !formData.locationNumber.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Location Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., New York"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., NY"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="e.g., 10001"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Additional Credentials (Optional)
                </label>
                <textarea
                  value={formData.additionalCredentials}
                  onChange={(e) => setFormData({ ...formData, additionalCredentials: e.target.value })}
                  placeholder="Any certifications, licenses, or credentials..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Generate Code */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Review Your Team Setup</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Name:</span>
                    <span className="font-semibold text-gray-900">{formData.teamName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location Number:</span>
                    <span className="font-semibold text-gray-900">{formData.locationNumber}</span>
                  </div>
                  {formData.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-semibold text-gray-900">{formData.city}</span>
                    </div>
                  )}
                  {formData.state && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">State:</span>
                      <span className="font-semibold text-gray-900">{formData.state}</span>
                    </div>
                  )}
                  {formData.zipCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ZIP Code:</span>
                      <span className="font-semibold text-gray-900">{formData.zipCode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-2 text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-600" />
                  What Happens Next?
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">1.</span>
                    <span>We'll generate a unique team code for you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">2.</span>
                    <span>Share this code with your sales reps during their signup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">3.</span>
                    <span>You'll see their activity in your manager dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Creating Team...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success - Show Team Code */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Created Successfully!</h2>
                <p className="text-gray-600">Your team is ready. Share this code with your sales reps.</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-center">
                <p className="text-blue-100 text-sm font-semibold mb-3 uppercase tracking-wide">Your Team Code</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-4">
                  <p className="text-5xl font-bold text-white tracking-widest font-mono">{teamCode}</p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 mx-auto"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">How to Share This Code</h3>
                <ul className="text-sm text-gray-700 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                    <span>Give this code to your sales reps when they sign up</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                    <span>They'll enter it during their registration process</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                    <span>You'll see their activity and performance in your manager dashboard</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onComplete}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg flex items-center justify-center gap-2"
              >
                Go to Manager Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
