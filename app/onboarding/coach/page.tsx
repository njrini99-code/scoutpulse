'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2, 
  User,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { US_STATES, type CoachType } from '@/lib/types';
import Link from 'next/link';

const STEPS = [
  { title: 'Coach Identity', icon: User },
  { title: 'Program Basics', icon: Building },
];

// Program level options by coach type
const PROGRAM_LEVELS: Record<CoachType, string[]> = {
  college: ['D1', 'D2', 'D3', 'NAIA'],
  juco: ['JUCO'],
  high_school: ['Varsity', 'JV', 'Freshman'],
  showcase: ['14U', '15U', '16U', '17U', '18U'],
};

export default function CoachOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const [coachType, setCoachType] = useState<CoachType | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    school_name: '',
    organization_name: '',
    city: '',
    state: '',
    staff_role: '',
    program_level: '',
    program_values: '',
    about: '',
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

    const { data: coach } = await supabase
      .from('coaches')
      .select('coach_type, onboarding_completed, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (coach?.onboarding_completed) {
      const dashboardPath = coach.coach_type === 'college' ? '/coach/college' :
                           coach.coach_type === 'juco' ? '/coach/juco' :
                           coach.coach_type === 'high_school' ? '/coach/high-school' :
                           coach.coach_type === 'showcase' ? '/coach/showcase' : '/coach';
      router.push(dashboardPath);
      return;
    }

    if (coach?.coach_type) {
      setCoachType(coach.coach_type);
    }

    if (coach?.full_name) {
      setFormData(prev => ({ ...prev, full_name: coach.full_name || '' }));
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (currentStep < 2) {
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

      const { data: coach } = await supabase
        .from('coaches')
        .select('id, coach_type')
        .eq('user_id', user.id)
        .single();

      if (!coach) {
        toast.error('Coach profile not found');
        return;
      }

      const updateData: Partial<{
        full_name: string | null;
        onboarding_completed: boolean;
        onboarding_step: number;
        school_name?: string | null;
        school_city?: string | null;
        school_state?: string | null;
        staff_role?: string | null;
        program_division?: string | null;
        organization_name?: string | null;
        organization_city?: string | null;
        organization_state?: string | null;
        program_values: string | null;
        about: string | null;
      }> = {
        full_name: formData.full_name || null,
        onboarding_completed: true,
        onboarding_step: 2,
      };

      // Set fields based on coach type
      if (coach.coach_type === 'college' || coach.coach_type === 'high_school') {
        updateData.school_name = formData.school_name || null;
        updateData.school_city = formData.city || null;
        updateData.school_state = formData.state || null;
        updateData.staff_role = formData.staff_role || null;
        updateData.program_division = formData.program_level || null;
      } else if (coach.coach_type === 'juco' || coach.coach_type === 'showcase') {
        updateData.organization_name = formData.organization_name || formData.school_name || null;
        updateData.organization_city = formData.city || null;
        updateData.organization_state = formData.state || null;
      }

      updateData.program_values = formData.program_values || null;
      updateData.about = formData.about || null;

      const { error } = await supabase
        .from('coaches')
        .update(updateData)
        .eq('id', coach.id);

      if (error) {
        toast.error('Error saving profile');
        logError(error, { component: 'CoachOnboarding', action: 'handleSubmit' });
        return;
      }

      setShowComplete(true);
      setTimeout(() => {
        const dashboardPath = coach.coach_type === 'college' ? '/coach/college' :
                             coach.coach_type === 'juco' ? '/coach/juco' :
                             coach.coach_type === 'high_school' ? '/coach/high-school' :
                             coach.coach_type === 'showcase' ? '/coach/showcase' : '/coach';
        router.push(dashboardPath);
      }, 2000);
    } catch (error) {
      logError(error, { component: 'CoachOnboarding', action: 'handleSubmit', metadata: { unexpected: true } });
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
          <h1 className="text-3xl font-bold text-white">Welcome to ScoutPulse!</h1>
          <p className="text-lg text-slate-300">Your program profile is ready.</p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            <p className="text-sm text-slate-400">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const programLevels = coachType ? PROGRAM_LEVELS[coachType] : [];

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
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Program Profile</h1>
          <p className="text-slate-400">Let&apos;s set up your recruiting presence</p>
        </div>

        {/* Progress */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Step {currentStep} of 2</span>
            <span>{Math.round((currentStep / 2) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 2) * 100} className="h-2" />
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

        {/* Step 1: Coach Identity */}
        {currentStep === 1 && (
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Coach Identity
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="bg-[#111315] border-white/10"
                />
              </div>

              {(coachType === 'college' || coachType === 'high_school') && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>School Name *</Label>
                    <Input
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      placeholder="University or High School name"
                      className="bg-[#111315] border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="bg-[#111315] border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
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
                    <Label>Staff Role</Label>
                    <Input
                      value={formData.staff_role}
                      onChange={(e) => setFormData({ ...formData, staff_role: e.target.value })}
                      placeholder="e.g., Head Coach, Assistant Coach, Recruiting Coordinator"
                      className="bg-[#111315] border-white/10"
                    />
                  </div>
                </>
              )}

              {(coachType === 'juco' || coachType === 'showcase') && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Organization Name *</Label>
                    <Input
                      value={formData.organization_name}
                      onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                      placeholder="Organization or program name"
                      className="bg-[#111315] border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="bg-[#111315] border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Program Basics */}
        {currentStep === 2 && (
          <div className="bg-slate-900/90 rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Program Basics
            </h2>

            <div className="space-y-6">
              {programLevels.length > 0 && (
                <div className="space-y-2">
                  <Label>Program Level</Label>
                  <Select value={formData.program_level} onValueChange={(v) => setFormData({ ...formData, program_level: v })}>
                    <SelectTrigger className="bg-[#111315] border-white/10">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {programLevels.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Program Values</Label>
                <Textarea
                  value={formData.program_values}
                  onChange={(e) => setFormData({ ...formData, program_values: e.target.value })}
                  placeholder="What does your program stand for? What values guide your team?"
                  className="bg-[#111315] border-white/10 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>About the Program</Label>
                <Textarea
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Tell recruits about your program, facilities, and what makes it special..."
                  className="bg-[#111315] border-white/10 min-h-[120px]"
                />
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

          {currentStep < 2 ? (
            <Button
              onClick={handleNext}
              variant="gradient"
              disabled={!formData.full_name || ((coachType === 'college' || coachType === 'high_school') && !formData.school_name) || ((coachType === 'juco' || coachType === 'showcase') && !formData.organization_name)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="gradient"
              disabled={saving}
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

