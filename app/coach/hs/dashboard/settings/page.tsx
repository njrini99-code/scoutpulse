'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { pageTransition } from '@/lib/animations';
import { logError } from '@/lib/utils/errorLogger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  Save,
  Upload,
  X,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import type { Coach } from '@/lib/types';
import { CoachDashboardSkeleton } from '@/components/ui/loading-state';

export default function HsCoachSettingsPage() {
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    school_name: '',
    school_city: '',
    school_state: '',
    email_contact: '',
    phone_contact: '',
    website_url: '',
    about: '',
    logo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      let coachData = null;

      if (isDevMode()) {
        const { data, error } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', DEV_ENTITY_IDS.coach)
          .single();
        if (error) {
          logError(error, { component: 'HsCoachSettingsPage', action: 'loadCoachData' });
          toast.error('Failed to load coach data');
          setLoading(false);
          return;
        }
        coachData = data;
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }
        const { data, error } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error) {
          logError(error, { component: 'HsCoachSettingsPage', action: 'loadCoachData' });
          toast.error('Failed to load coach data');
          setLoading(false);
          return;
        }
        coachData = data;
      }

      if (coachData) {
        setCoach(coachData);
        setFormData({
          full_name: coachData.full_name || '',
          school_name: coachData.school_name || '',
          school_city: coachData.school_city || '',
          school_state: coachData.school_state || '',
          email_contact: coachData.email_contact || '',
          phone_contact: coachData.phone_contact || '',
          website_url: coachData.website_url || '',
          about: coachData.about || '',
          logo_url: coachData.logo_url || '',
        });
      }
      setLoading(false);
    } catch (error) {
      logError(error, { component: 'HsCoachSettingsPage', action: 'loadData', metadata: { unexpected: true } });
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      let coachId: string | null = null;

      if (isDevMode()) {
        coachId = DEV_ENTITY_IDS.coach;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be logged in to save changes');
          setSaving(false);
          return;
        }
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!coachData) {
          toast.error('Coach profile not found');
          setSaving(false);
          return;
        }
        coachId = coachData.id;
      }

      const { error } = await supabase
        .from('coaches')
        .update({
          full_name: formData.full_name || null,
          school_name: formData.school_name || null,
          school_city: formData.school_city || null,
          school_state: formData.school_state || null,
          email_contact: formData.email_contact || null,
          phone_contact: formData.phone_contact || null,
          website_url: formData.website_url || null,
          about: formData.about || null,
          logo_url: formData.logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coachId);

      if (error) {
        logError(error, { component: 'HsCoachSettingsPage', action: 'saveSettings' });
        toast.error('Failed to save settings');
      } else {
        toast.success('Settings saved successfully');
        // Reload data to get updated values
        await loadData();
      }
      setSaving(false);
    } catch (error) {
      logError(error, { component: 'HsCoachSettingsPage', action: 'saveSettings', metadata: { unexpected: true } });
      toast.error('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();
      let coachId: string | null = null;

      if (isDevMode()) {
        coachId = DEV_ENTITY_IDS.coach;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be logged in to upload logo');
          setSaving(false);
          return;
        }
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!coachData) {
          toast.error('Coach profile not found');
          setSaving(false);
          return;
        }
        coachId = coachData.id;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${coachId}/logo-${Date.now()}.${fileExt}`;
      const filePath = `coaches/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        logError(uploadError, { component: 'HsCoachSettingsPage', action: 'uploadLogo' });
        toast.error('Failed to upload logo');
        setSaving(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update coach record
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', coachId);

      if (updateError) {
        logError(updateError, { component: 'HsCoachSettingsPage', action: 'updateLogoUrl' });
        toast.error('Failed to update logo URL');
      } else {
        setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        toast.success('Logo uploaded successfully');
      }
      setSaving(false);
    } catch (error) {
      logError(error, { component: 'HsCoachSettingsPage', action: 'uploadLogo', metadata: { unexpected: true } });
      toast.error('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return <CoachDashboardSkeleton />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coachData = coach as any;
  const programColor = coachData?.primary_color || '#F59E0B';
  const schoolName = coach?.school_name || 'Your High School';
  const schoolInitials = schoolName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/coach/hs/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Program Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your program branding and preferences</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-6">
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card glass className="rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-white/20 shadow-xl rounded-2xl">
                  <AvatarImage src={formData.logo_url || undefined} alt={`${schoolName} logo`} className="rounded-2xl object-cover" />
                  <AvatarFallback 
                    className="rounded-2xl text-2xl font-bold text-white"
                    style={{ background: programColor }}
                  >
                    {schoolInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Program Logo</h3>
                <p className="text-sm text-muted-foreground mb-3">Upload your school or program logo (max 5MB)</p>
                <label htmlFor="logo-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </span>
                  </Button>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={saving}
                />
                {formData.logo_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 gap-2 text-destructive hover:text-destructive"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card glass className="rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                    placeholder="Lincoln High School"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school_city">City</Label>
                  <Input
                    id="school_city"
                    value={formData.school_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_city: e.target.value }))}
                    placeholder="Raleigh"
                  />
                </div>
                <div>
                  <Label htmlFor="school_state">State</Label>
                  <Input
                    id="school_state"
                    value={formData.school_state}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_state: e.target.value }))}
                    placeholder="NC"
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="about">About Your Program</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  placeholder="Tell us about your program, values, and what makes it special..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card glass className="rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email_contact">Email</Label>
                <Input
                  id="email_contact"
                  type="email"
                  value={formData.email_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_contact: e.target.value }))}
                  placeholder="coach@school.edu"
                />
              </div>
              <div>
                <Label htmlFor="phone_contact">Phone</Label>
                <Input
                  id="phone_contact"
                  type="tel"
                  value={formData.phone_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_contact: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://school.edu/athletics"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link href="/coach/hs/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
              style={{ background: programColor }}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 bg-white/20 rounded animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
