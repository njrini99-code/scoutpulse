'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Save, Loader2, Trophy, Building, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ShowcaseTeam {
  id: string;
  name: string;
  organization_name?: string;
  city?: string;
  state?: string;
  logo_url?: string;
  banner_url?: string;
  about?: string;
  program_values?: string;
  coach_id: string;
}

export default function ShowcaseProgramPage() {
  const router = useRouter();
  const [team, setTeam] = useState<ShowcaseTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    organization_name: '',
    city: '',
    state: '',
    about: '',
    program_values: ''
  });

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get coach record
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .eq('coach_type', 'showcase')
        .single();

      if (!coach) {
        toast.error('Coach profile not found');
        return;
      }

      // Get team
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('team_type', 'showcase')
        .maybeSingle();

      if (error) throw error;

      if (teamData) {
        setTeam(teamData);
        setFormData({
          name: teamData.name || '',
          organization_name: teamData.organization_name || '',
          city: teamData.city || '',
          state: teamData.state || '',
          about: teamData.about || '',
          program_values: teamData.program_values || ''
        });
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingLogo(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${team.id}-logo.${fileExt}`;
      const filePath = `team-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('team-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', team.id);

      if (updateError) throw updateError;

      setTeam({ ...team, logo_url: urlData.publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!team) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('teams')
        .update(formData)
        .eq('id', team.id);

      if (error) throw error;

      setTeam({ ...team, ...formData });
      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Organization Not Found</h2>
          <p className="text-slate-500">Please create your showcase organization first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-slate-800">Organization Settings</h1>
          </div>
          <p className="text-slate-600">Manage your showcase organization profile</p>
        </div>

        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Organization Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="Organization logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Trophy className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </label>

                  <p className="text-sm text-slate-500 mt-2">
                    Recommended: Square image, min 200x200px, max 5MB
                  </p>

                  {team.logo_url && (
                    <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Logo uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team_name">Team Name</Label>
                  <Input
                    id="team_name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., 17U Black"
                  />
                </div>
                <div>
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                    placeholder="e.g., Atlanta Aces Baseball"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g., Atlanta"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="e.g., GA"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="about">About the Organization</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => setFormData({...formData, about: e.target.value})}
                  placeholder="Describe your showcase organization, tournaments, player development approach..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="program_values">Organization Values</Label>
                <Textarea
                  id="program_values"
                  value={formData.program_values}
                  onChange={(e) => setFormData({...formData, program_values: e.target.value})}
                  placeholder="What values does your organization emphasize? (e.g., Elite Competition, Player Development, College Exposure)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
