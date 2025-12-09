'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Save,
  Loader2,
  Building,
  Users,
  Mail,
  Phone,
  Palette,
  Settings,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import Link from 'next/link';

interface Coach {
  id: string;
  program_name?: string;
  logo_url?: string;
  about?: string;
  program_values?: string;
  what_we_look_for?: string;
  academic_profile?: string;
  facility_summary?: string;
  tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  program_website?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
}

export default function CoachSettingsPage() {
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [formData, setFormData] = useState({
    program_name: '',
    about: '',
    program_values: '',
    what_we_look_for: '',
    academic_profile: '',
    facility_summary: '',
    tagline: '',
    primary_color: '#10b981',
    secondary_color: '#059669',
    accent_color: '#047857',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    program_website: ''
  });

  // Staff management
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    email: ''
  });

  // Google Calendar integration
  const [calendarSynced, setCalendarSynced] = useState(false);

  useEffect(() => {
    loadCoachData();
    loadStaffData();
  }, []);

  async function loadCoachData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: coachData, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setCoach(coachData);
      setFormData({
        program_name: coachData.program_name || '',
        about: coachData.about || '',
        program_values: coachData.program_values || '',
        what_we_look_for: coachData.what_we_look_for || '',
        academic_profile: coachData.academic_profile || '',
        facility_summary: coachData.facility_summary || '',
        tagline: coachData.tagline || '',
        primary_color: coachData.primary_color || '#10b981',
        secondary_color: coachData.secondary_color || '#059669',
        accent_color: coachData.accent_color || '#047857',
        twitter_url: coachData.twitter_url || '',
        instagram_url: coachData.instagram_url || '',
        youtube_url: coachData.youtube_url || '',
        program_website: coachData.program_website || ''
      });
    } catch (error) {
      console.error('Error loading coach data:', error);
      toast.error('Failed to load coach data');
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // For demo purposes, we'll create mock staff data
      // In a real app, this would come from a staff_members table
      setStaff([
        { id: '1', name: 'John Smith', role: 'Assistant Coach', email: 'john@program.com', status: 'active' },
        { id: '2', name: 'Sarah Johnson', role: 'Recruiting Coordinator', email: 'sarah@program.com', status: 'active' }
      ]);
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coach) return;

    // Validate file
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
      const fileName = `${coach.id}-logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('program-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('program-assets')
        .getPublicUrl(filePath);

      // Update coach profile with logo URL
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', coach.id);

      if (updateError) throw updateError;

      setCoach({ ...coach, logo_url: urlData.publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!coach) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('coaches')
        .update(formData)
        .eq('id', coach.id);

      if (error) throw error;

      setCoach({ ...coach, ...formData });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.role || !staffForm.email) {
      toast.error('Please fill in all fields');
      return;
    }

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: staffForm.name,
      role: staffForm.role,
      email: staffForm.email,
      status: 'pending'
    };

    setStaff([...staff, newStaff]);
    setStaffForm({ name: '', role: '', email: '' });
    setShowAddStaff(false);
    toast.success('Staff member added successfully');
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    setStaff(staff.map(s =>
      s.id === editingStaff.id
        ? { ...editingStaff }
        : s
    ));
    setEditingStaff(null);
    toast.success('Staff member updated successfully');
  };

  const handleDeleteStaff = async (staffId: string) => {
    setStaff(staff.filter(s => s.id !== staffId));
    toast.success('Staff member removed');
  };

  // Google Calendar handlers
  const handleGoogleCalendarAuth = () => {
    toast.info('Google Calendar integration coming soon');
  };

  const handleSyncNow = () => {
    toast.info('Manual sync functionality coming soon');
  };

  const handleDisconnect = () => {
    setCalendarSynced(false);
    toast.success('Google Calendar disconnected');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Coach Profile Not Found</h2>
          <p className="text-slate-500">Please complete your coach setup first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-slate-800">Coach Settings</h1>
          </div>
          <p className="text-slate-600">Manage your program profile, staff, and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Program Profile</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Program Profile Tab */}
          <TabsContent value="profile" className="space-y-6">

            {/* Logo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Program Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {/* Current logo preview */}
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    {coach.logo_url ? (
                      <img src={coach.logo_url} alt="Program logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Building className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Upload section */}
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

                    {coach.logo_url && (
                      <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Logo uploaded successfully
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Information */}
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program_name">Program Name</Label>
                    <Input
                      id="program_name"
                      value={formData.program_name}
                      onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                      placeholder="Enter program name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                      placeholder="Brief program tagline"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="about">About the Program</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => setFormData({...formData, about: e.target.value})}
                    placeholder="Describe your program..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="what_we_look_for">What We Look For</Label>
                  <Textarea
                    id="what_we_look_for"
                    value={formData.what_we_look_for}
                    onChange={(e) => setFormData({...formData, what_we_look_for: e.target.value})}
                    placeholder="What qualities do you look for in recruits?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academic_profile">Academic Profile</Label>
                    <Textarea
                      id="academic_profile"
                      value={formData.academic_profile}
                      onChange={(e) => setFormData({...formData, academic_profile: e.target.value})}
                      placeholder="Describe your academic expectations..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="facility_summary">Facilities</Label>
                    <Textarea
                      id="facility_summary"
                      value={formData.facility_summary}
                      onChange={(e) => setFormData({...formData, facility_summary: e.target.value})}
                      placeholder="Describe your facilities..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors & Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Colors & Branding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="primary_color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                        className="w-12 h-10 rounded border border-slate-300"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                        placeholder="#10b981"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="secondary_color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                        className="w-12 h-10 rounded border border-slate-300"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                        placeholder="#059669"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="accent_color"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({...formData, accent_color: e.target.value})}
                        className="w-12 h-10 rounded border border-slate-300"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) => setFormData({...formData, accent_color: e.target.value})}
                        placeholder="#047857"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media & Website</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="program_website">Program Website</Label>
                  <Input
                    id="program_website"
                    type="url"
                    value={formData.program_website}
                    onChange={(e) => setFormData({...formData, program_website: e.target.value})}
                    placeholder="https://www.program.edu"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="twitter_url">Twitter/X</Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({...formData, twitter_url: e.target.value})}
                      placeholder="https://twitter.com/program"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                      placeholder="https://instagram.com/program"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube_url">YouTube</Label>
                    <Input
                      id="youtube_url"
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                      placeholder="https://youtube.com/@program"
                    />
                  </div>
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
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Staff Management
                  </CardTitle>
                  <Button onClick={() => setShowAddStaff(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {staff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">No staff members added yet</p>
                    <Button onClick={() => setShowAddStaff(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Staff Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.role}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStaff(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStaff(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-slate-900/70 border-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Calendar Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Google Calendar Integration */}
                  <div className="backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Google Calendar</h3>

                    {!calendarSynced ? (
                      <div>
                        <p className="text-white/70 mb-4">
                          Sync your ScoutPulse calendar with Google Calendar to manage all your events in one place.
                        </p>
                        <button
                          onClick={handleGoogleCalendarAuth}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.316 5.684h-2.372v2.372h2.372V5.684zm-2.947 0H12.997v2.372h2.372V5.684zm-2.947 0H10.05v2.372h2.372V5.684zm8.526 8.526v-2.947h-2.372v2.947h2.372zm0-2.947h-2.372V8.316h2.372v2.947zm0-2.947h-2.372V5.369h2.372v2.947zm-2.947 11.368h2.372v-2.372h-2.372v2.372zm2.947-5.684h2.372V12.997h-2.372v2.372zm0 5.684h2.372v-2.372h-2.372v2.372zM15.369 22.105h2.947v-2.372h-2.947v2.372zm-2.947 0h2.947v-2.372H12.422v2.372zm-2.947 0h2.947v-2.372H9.474v2.372zm-2.947 0H9.474v-2.372H6.526v2.372zm-2.947 0H6.526v-2.372H3.579v2.372zm11.895-11.895V8.842H12.422v1.368h2.947zm-5.894 0V8.842H9.474v1.368h2.947zm-5.894 0V8.842H6.526v1.368h2.947zm11.895 2.947v-2.947H15.369v2.947h2.947zm-5.894 0v-2.947H12.422v2.947h2.947zm-5.894 0v-2.947H9.474v2.947h2.947zm-5.894 0v-2.947H6.526v2.947h2.947zm11.895 2.947v-2.947H15.369v2.947h2.947zm-5.894 0v-2.947H12.422v2.947h2.947zm-5.894 0v-2.947H9.474v2.947h2.947zm-5.894 0v-2.947H6.526v2.947h2.947zM1.632 1.632v20.736h20.736V1.632H1.632z"/>
                          </svg>
                          Connect Google Calendar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">Google Calendar Connected</div>
                            <div className="text-sm text-white/60">Syncing automatically</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSyncNow}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            Sync Now
                          </Button>
                          <Button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Integrations Placeholder */}
                  <div className="backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Other Integrations</h3>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400">Additional integrations coming soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Staff Modal */}
        {showAddStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Staff Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="staff_name">Name</Label>
                  <Input
                    id="staff_name"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="staff_role">Role</Label>
                  <select
                    id="staff_role"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Select role</option>
                    <option value="Assistant Coach">Assistant Coach</option>
                    <option value="Recruiting Coordinator">Recruiting Coordinator</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="staff_email">Email</Label>
                  <Input
                    id="staff_email"
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                    placeholder="email@program.com"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddStaff} className="flex-1">
                    Add Staff
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddStaff(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Staff Modal */}
        {editingStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Staff Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit_staff_name">Name</Label>
                  <Input
                    id="edit_staff_name"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_staff_role">Role</Label>
                  <select
                    id="edit_staff_role"
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="Assistant Coach">Assistant Coach</option>
                    <option value="Recruiting Coordinator">Recruiting Coordinator</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit_staff_email">Email</Label>
                  <Input
                    id="edit_staff_email"
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
                    placeholder="email@program.com"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateStaff} className="flex-1">
                    Update Staff
                  </Button>
                  <Button variant="outline" onClick={() => setEditingStaff(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
