'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Ruler, 
  Target,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { POSITIONS, GRAD_YEARS, US_STATES, PLAYER_GOALS } from '@/lib/types';
import Link from 'next/link';

const STEPS = [
  { title: 'Home Base', icon: MapPin },
  { title: 'Physical & Position', icon: Ruler },
  { title: 'Goals & Links', icon: Target },
];

export default function PlayerOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    grad_year: '',
    high_school_name: '',
    high_school_city: '',
    high_school_state: '',
    showcase_team_name: '',
    height_feet: '',
    height_inches: '',
    weight_lbs: '',
    primary_position: '',
    secondary_position: '',
    throws: '',
    bats: '',
    perfect_game_url: '',
    twitter_url: '',
    primary_goal: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: player } = await supabase
      .from('players')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (player?.onboarding_completed) {
      router.push('/player');
      return;
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!player) {
        toast.error('Player profile not found');
        return;
      }

      const updateData: Partial<{
        grad_year: number | null;
        high_school_name: string | null;
        high_school_city: string | null;
        high_school_state: string | null;
        showcase_team_name: string | null;
        height_feet: number | null;
        height_inches: number | null;
        weight_lbs: number | null;
        primary_position: string | null;
        secondary_position: string | null;
        throws: string | null;
        bats: string | null;
        perfect_game_url: string | null;
        twitter_url: string | null;
        primary_goal: string | null;
        onboarding_completed: boolean;
        onboarding_step: number;
      }> = {
        grad_year: formData.grad_year ? parseInt(formData.grad_year) : null,
        high_school_name: formData.high_school_name || null,
        high_school_city: formData.high_school_city || null,
        high_school_state: formData.high_school_state || null,
        showcase_team_name: formData.showcase_team_name || null,
        height_feet: formData.height_feet ? parseInt(formData.height_feet) : null,
        height_inches: formData.height_inches ? parseInt(formData.height_inches) : null,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        primary_position: formData.primary_position || null,
        secondary_position: formData.secondary_position || null,
        throws: formData.throws || null,
        bats: formData.bats || null,
        perfect_game_url: formData.perfect_game_url || null,
        twitter_url: formData.twitter_url || null,
        primary_goal: formData.primary_goal || null,
        onboarding_completed: true,
        onboarding_step: 3,
      };

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', player.id);

      if (error) {
        toast.error('Error saving profile');
        logError(error, { component: 'PlayerOnboarding', action: 'handleSubmit' });
        return;
      }

      setShowComplete(true);
      setTimeout(() => {
        router.push('/player');
      }, 2000);
    } catch (error) {
      logError(error, { component: 'PlayerOnboarding', action: 'handleSubmit', metadata: { unexpected: true } });
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 bg-blue-500/20 rounded animate-pulse" />
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">We appreciate you trusting us with your goals.</h1>
          <p className="text-lg text-slate-300">Let&apos;s get to work.</p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            <p className="text-sm text-slate-400">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-slate-400">Let&apos;s get to know you better</p>
        </div>

        {/* Progress */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === idx + 1;
              const isCompleted = currentStep > idx + 1;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : isCompleted 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-700 bg-slate-800'
                  }`}>
                    <StepIcon className={`w-5 h-5 ${
                      isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`} />
                  </div>
                  <p className={`text-xs text-center ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Player Basics */}
        {currentStep === 1 && (
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Home Base
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grad Year *</Label>
                <Select value={formData.grad_year} onValueChange={(v) => setFormData({ ...formData, grad_year: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>High School *</Label>
                <Input
                  value={formData.high_school_name}
                  onChange={(e) => setFormData({ ...formData, high_school_name: e.target.value })}
                  placeholder="Your high school"
                  className="bg-[#111315] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.high_school_city}
                  onChange={(e) => setFormData({ ...formData, high_school_city: e.target.value })}
                  placeholder="City"
                  className="bg-[#111315] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select value={formData.high_school_state} onValueChange={(v) => setFormData({ ...formData, high_school_state: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Showcase / Travel Team (Optional)</Label>
                <Input
                  value={formData.showcase_team_name}
                  onChange={(e) => setFormData({ ...formData, showcase_team_name: e.target.value })}
                  placeholder="Team name"
                  className="bg-[#111315] border-white/10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Physical & Position */}
        {currentStep === 2 && (
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-400" />
              Physical & Position
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (Feet) *</Label>
                <Select value={formData.height_feet} onValueChange={(v) => setFormData({ ...formData, height_feet: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Feet" />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 5, 6, 7].map((ft) => (
                      <SelectItem key={ft} value={ft.toString()}>{ft}'</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Height (Inches) *</Label>
                <Select value={formData.height_inches} onValueChange={(v) => setFormData({ ...formData, height_inches: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Inches" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}"</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Weight (lbs) *</Label>
                <Input
                  type="number"
                  value={formData.weight_lbs}
                  onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                  placeholder="Weight"
                  className="bg-[#111315] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Primary Position *</Label>
                <Select value={formData.primary_position} onValueChange={(v) => setFormData({ ...formData, primary_position: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Secondary Position</Label>
                <Select value={formData.secondary_position} onValueChange={(v) => setFormData({ ...formData, secondary_position: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Throws *</Label>
                <Select value={formData.throws} onValueChange={(v) => setFormData({ ...formData, throws: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">Right</SelectItem>
                    <SelectItem value="L">Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bats *</Label>
                <Select value={formData.bats} onValueChange={(v) => setFormData({ ...formData, bats: v })}>
                  <SelectTrigger className="bg-[#111315] border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">Right</SelectItem>
                    <SelectItem value="L">Left</SelectItem>
                    <SelectItem value="S">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goals & Links */}
        {currentStep === 3 && (
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Goals & Links
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>What is your goal? *</Label>
                <div className="grid gap-3">
                  {PLAYER_GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setFormData({ ...formData, primary_goal: goal })}
                      aria-label={`Select goal: ${goal}`}
                      aria-pressed={formData.primary_goal === goal}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.primary_goal === goal
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 hover:border-white/20 bg-[#111315]'
                      }`}
                    >
                      <p className={`font-medium ${formData.primary_goal === goal ? 'text-white' : 'text-slate-300'}`}>
                        {goal}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <Label>Perfect Game URL (Optional)</Label>
                  <Input
                    type="url"
                    value={formData.perfect_game_url}
                    onChange={(e) => setFormData({ ...formData, perfect_game_url: e.target.value })}
                    placeholder="https://perfectgame.org/..."
                    className="bg-[#111315] border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Twitter URL (Optional)</Label>
                  <Input
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                    placeholder="https://twitter.com/..."
                    className="bg-[#111315] border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="bg-[#111315] border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              variant="gradient"
              disabled={!formData.grad_year || !formData.high_school_name || (currentStep === 2 && (!formData.height_feet || !formData.weight_lbs || !formData.primary_position || !formData.throws || !formData.bats))}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="gradient"
              disabled={saving || !formData.primary_goal}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

