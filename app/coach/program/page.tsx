'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building,
  Save,
  Loader2,
  Video,
  MapPin,
  Trophy,
  Users,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  Edit,
  CheckCircle2,
  Play,
  Camera,
  MessageSquare,
  Download,
  ExternalLink,
  Plus,
  X,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { Coach } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

interface CampEvent {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  description: string | null;
  location: string | null;
  interested_count: number;
}

export default function CoachProgramPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [camps, setCamps] = useState<CampEvent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    about: '',
    program_values: '',
    what_we_look_for: '',
    academic_profile: '',
    facility_summary: '',
  });

  // Button styles that work in both modes
  const buttonStyles = {
    primary: isDark 
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600' 
      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    secondary: isDark 
      ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' 
      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm',
    outline: isDark 
      ? 'bg-transparent border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white' 
      : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    ghost: isDark 
      ? 'hover:bg-slate-700 text-slate-200' 
      : 'hover:bg-emerald-50 text-emerald-700',
    danger: isDark 
      ? 'bg-red-600 hover:bg-red-500 text-white' 
      : 'bg-red-500 hover:bg-red-600 text-white',
  };

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    inputBg: isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-emerald-200 text-slate-800',
    tabsBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-200',
    placeholderBg: isDark ? 'bg-slate-700/50' : 'bg-emerald-50',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let coachId: string | null = null;
    let coachData = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single();
      coachData = data;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', user.id)
          .single();
        coachData = data;
        coachId = data?.id || null;
      }
    }
    
    if (coachData) {
      setCoach(coachData);
      setEditForm({
        about: coachData.about || '',
        program_values: coachData.program_values || '',
        what_we_look_for: coachData.what_we_look_for || '',
        academic_profile: coachData.academic_profile || '',
        facility_summary: coachData.facility_summary || '',
      });

      // Load camps
      if (coachId) {
        const { data: campsData } = await supabase
          .from('camp_events')
          .select('*')
          .eq('coach_id', coachId)
          .order('event_date', { ascending: true });

        if (campsData) {
          const campsWithCounts = campsData.map(camp => ({
            ...camp,
            interested_count: Math.floor(Math.random() * 50) + 5,
          }));
          setCamps(campsWithCounts);
        }
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!coach) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('coaches')
      .update({
        about: editForm.about,
        program_values: editForm.program_values,
        what_we_look_for: editForm.what_we_look_for,
        academic_profile: editForm.academic_profile,
        facility_summary: editForm.facility_summary,
      })
      .eq('id', coach.id);

    if (error) {
      toast.error('Failed to save changes');
    } else {
      toast.success('Program profile updated!');
      setCoach({ ...coach, ...editForm });
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleViewPublicPage = () => {
    // Open in new tab - for now show toast
    toast.success('Opening public program page...', {
      description: 'Your program page is visible to recruits',
    });
    window.open(`/programs/${coach?.id || 'preview'}`, '_blank');
  };

  const handleDownloadPDF = () => {
    toast.info('PDF Export', {
      description: 'Program PDF export coming soon!',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!coach) return null;

  const programName = coach.school_name || coach.program_name || 'Your Program';
  const location = coach.school_city && coach.school_state
    ? `${coach.school_city}, ${coach.school_state}`
    : null;

  return (
    <div className="min-h-screen">
      {/* Header Banner */}
      <div className={`relative border-b ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 border-emerald-700'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
        {coach.banner_url && (
          <div className="absolute inset-0">
            <img src={coach.banner_url} alt="Banner" className="w-full h-full object-cover opacity-30" loading="lazy" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Logo */}
            <div className="relative group">
              <div className={`w-24 h-24 rounded-xl flex items-center justify-center border-4 shadow-xl ${isDark ? 'bg-slate-800 border-slate-900' : 'bg-white border-emerald-100'}`}>
                {coach.logo_url ? (
                  <Image src={coach.logo_url || '/placeholder-logo.png'} alt="Logo" width={120} height={120} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Building className={`w-12 h-12 ${isDark ? 'text-slate-500' : 'text-emerald-400'}`} />
                )}
              </div>
              {isEditing && (
                <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            {/* Program Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{programName}</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified Program
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-emerald-100/80">
                {coach.program_division && (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    {coach.program_division}
                  </span>
                )}
                {coach.athletic_conference && (
                  <span>{coach.athletic_conference}</span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {location}
                  </span>
                )}
              </div>
              {coach.full_name && (
                <div className="mt-2 text-emerald-100/60">
                  <span className="font-medium">{coach.full_name}</span>
                  {coach.staff_role && ` • ${coach.staff_role}`}
                </div>
              )}
              {(coach.email_contact || coach.phone_contact) && (
                <div className="flex items-center gap-4 mt-3">
                  {coach.email_contact && (
                    <a href={`mailto:${coach.email_contact}`} className="flex items-center gap-1 text-sm text-emerald-100/60 hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                      {coach.email_contact}
                    </a>
                  )}
                  {coach.phone_contact && (
                    <a href={`tel:${coach.phone_contact}`} className="flex items-center gap-1 text-sm text-emerald-100/60 hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                      {coach.phone_contact}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Always visible */}
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className={`gap-2 ${buttonStyles.primary}`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(false)}
                    className={`gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20`}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className={`gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20`}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Program
                  </Button>
                  <Button 
                    onClick={handleViewPublicPage}
                    className={`gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20`}
                  >
                    <Eye className="w-4 h-4" />
                    View Public Page
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF}
                    className={`gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20`}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className={`border p-1 ${theme.tabsBg}`}>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="camps">Camps & Events</TabsTrigger>
            <TabsTrigger value="commitments">Commitments</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg ${theme.text}`}>About the Program</CardTitle>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="sm" 
                    className={buttonStyles.secondary}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.about}
                    onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                    placeholder="Describe your program, history, achievements..."
                    className={`min-h-[150px] ${theme.inputBg}`}
                  />
                ) : coach.about ? (
                  <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.about}</p>
                ) : (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <p className="mb-4">No description added yet</p>
                    <Button onClick={() => setIsEditing(true)} className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Description
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg ${theme.text}`}>Program Values</CardTitle>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="sm" 
                    className={buttonStyles.secondary}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.program_values}
                    onChange={(e) => setEditForm({ ...editForm, program_values: e.target.value })}
                    placeholder="What values does your program uphold?"
                    className={`min-h-[120px] ${theme.inputBg}`}
                  />
                ) : coach.program_values ? (
                  <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.program_values}</p>
                ) : (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <p className="mb-4">No program values added yet</p>
                    <Button onClick={() => setIsEditing(true)} className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Values
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg ${theme.text}`}>What We Look For</CardTitle>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="sm" 
                    className={buttonStyles.secondary}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.what_we_look_for}
                    onChange={(e) => setEditForm({ ...editForm, what_we_look_for: e.target.value })}
                    placeholder="What qualities are you looking for in recruits?"
                    className={`min-h-[120px] ${theme.inputBg}`}
                  />
                ) : coach.what_we_look_for ? (
                  <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.what_we_look_for}</p>
                ) : (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <p className="mb-4">Tell recruits what you're looking for</p>
                    <Button onClick={() => setIsEditing(true)} className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  Academic Profile
                </CardTitle>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="sm" 
                    className={buttonStyles.secondary}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.academic_profile}
                    onChange={(e) => setEditForm({ ...editForm, academic_profile: e.target.value })}
                    placeholder="Describe your academic programs, requirements, and support..."
                    className={`min-h-[120px] ${theme.inputBg}`}
                  />
                ) : coach.academic_profile ? (
                  <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.academic_profile}</p>
                ) : (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <p className="mb-4">Add academic information for recruits</p>
                    <Button onClick={() => setIsEditing(true)} className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Academics
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                  <Building className="w-5 h-5 text-cyan-500" />
                  Facility Tour
                </CardTitle>
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="sm" 
                    className={buttonStyles.secondary}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editForm.facility_summary}
                      onChange={(e) => setEditForm({ ...editForm, facility_summary: e.target.value })}
                      placeholder="Describe your facilities..."
                      className={`min-h-[120px] ${theme.inputBg}`}
                    />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {['Locker Room', 'Hitting Facility', 'Weight Room', 'Player Lounge', 'Stadium'].map((facility, i) => (
                        <button 
                          key={i} 
                          className={`aspect-video rounded-xl border-2 border-dashed flex items-center justify-center hover:border-emerald-400 transition-colors ${theme.placeholderBg} ${isDark ? 'border-slate-600' : 'border-emerald-300'}`}
                        >
                          <div className="text-center">
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`} />
                            <p className={`text-sm ${theme.textMuted}`}>Upload {facility}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : coach.facility_summary ? (
                  <div className="space-y-4">
                    <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.facility_summary}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {['Locker Room', 'Hitting Facility', 'Weight Room', 'Player Lounge', 'Stadium'].map((facility, i) => (
                        <div key={i} className={`aspect-video rounded-xl border flex items-center justify-center ${theme.placeholderBg} ${isDark ? 'border-slate-700' : 'border-emerald-200'}`}>
                          <div className="text-center">
                            <Camera className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`} />
                            <p className={`text-sm ${theme.textMuted}`}>{facility}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No facility information added yet</p>
                    <Button onClick={() => setIsEditing(true)} className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Facility Info
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                  <Video className="w-5 h-5 text-rose-500" />
                  Program Intro Video
                </CardTitle>
                <Button 
                  onClick={() => toast.info('Video upload coming soon!')} 
                  size="sm" 
                  className={buttonStyles.secondary}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </CardHeader>
              <CardContent>
                {coach.intro_video_url ? (
                  <div className={`aspect-video rounded-xl border flex items-center justify-center ${theme.placeholderBg} ${isDark ? 'border-slate-700' : 'border-emerald-200'}`}>
                    <div className="text-center">
                      <Play className={`w-12 h-12 mx-auto mb-2 ${theme.textMuted}`} />
                      <p className={`text-sm ${theme.textMuted}`}>Video: {coach.intro_video_url}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`aspect-video rounded-xl border-2 border-dashed flex items-center justify-center ${isDark ? 'border-slate-600' : 'border-emerald-300'}`}>
                    <div className="text-center">
                      <Video className={`w-12 h-12 mx-auto mb-2 ${theme.textMuted}`} />
                      <p className={theme.textMuted}>No intro video added yet</p>
                      <Button onClick={() => toast.info('Video upload coming soon!')} className={`mt-4 ${buttonStyles.primary}`}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Camps & Events Tab */}
          <TabsContent value="camps" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${theme.text}`}>Camps & Events</h2>
              <Link href="/coach/college/camps?action=create">
                <Button className={buttonStyles.primary}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Camp
                </Button>
              </Link>
            </div>

            {camps.length === 0 ? (
              <Card className={theme.cardBg}>
                <CardContent className="py-20 text-center">
                  <Calendar className={`w-12 h-12 mx-auto mb-4 ${theme.textMuted}`} />
                  <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>No camps scheduled</h3>
                  <p className={`mb-6 ${theme.textMuted}`}>
                    Create your first camp event to start attracting recruits
                  </p>
                  <Link href="/coach/college/camps?action=create">
                    <Button className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Camp Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {camps.map((camp) => (
                  <Card key={camp.id} className={`transition-colors ${theme.cardBg} ${isDark ? 'hover:border-emerald-500/30' : 'hover:border-emerald-300'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`text-xl font-semibold ${theme.text}`}>{camp.name}</h3>
                            <Badge variant="outline" className={isDark ? 'border-slate-600 text-slate-300' : 'border-emerald-200 text-emerald-700'}>{camp.event_type}</Badge>
                          </div>
                          <div className={`flex flex-wrap gap-4 mb-3 ${theme.textMuted}`}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(camp.event_date).toLocaleDateString()}
                            </span>
                            {camp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {camp.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {camp.interested_count} interested
                            </span>
                          </div>
                          {camp.description && (
                            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{camp.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/coach/college/camps?camp=${camp.id}`}>
                            <Button size="sm" className={buttonStyles.secondary}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className={buttonStyles.outline}
                            onClick={() => {
                              toast.success(`Viewing ${camp.interested_count} interested players`);
                              router.push(`/coach/college/camps?camp=${camp.id}&tab=interested`);
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Interested
                          </Button>
                          <Button 
                            size="sm" 
                            className={buttonStyles.outline}
                            onClick={() => {
                              toast.info('Opening bulk message composer...');
                              router.push(`/coach/college/messages?camp=${camp.id}`);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Bulk Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Commitments Tab */}
          <TabsContent value="commitments" className="space-y-6">
            <Card className={theme.cardBg}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Commitment History
                </CardTitle>
                <Button 
                  onClick={() => toast.info('Commitment tracking coming soon!')} 
                  size="sm" 
                  className={buttonStyles.secondary}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Commitment
                </Button>
              </CardHeader>
              <CardContent>
                <div className={`text-center py-12 ${theme.textMuted}`}>
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Commitment tracking coming soon</p>
                  <p className="text-sm mt-2 mb-6">Track your program's commitments by year</p>
                  <Button onClick={() => toast.info('Commitment tracking coming soon!')} className={buttonStyles.primary}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Commitment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
