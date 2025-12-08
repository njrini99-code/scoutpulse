'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building, Save, Loader2, Video, MapPin, Trophy, Users, GraduationCap,
  Calendar, Mail, Phone, Edit, CheckCircle2, Play, Camera, Plus, X, Upload,
  Eye, EyeOff, Palette, ExternalLink, Twitter, Instagram, Youtube, Globe,
  Heart, Star, Dumbbell, Home, Award, Quote, ArrowRight, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Coach } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface CampEvent {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  description: string | null;
  location: string | null;
  interested_count: number;
  status?: 'open' | 'limited' | 'full';
}

interface Facility {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  stats?: string;
}

interface Commitment {
  id: string;
  name: string;
  position: string;
  grad_year: number;
  hometown: string;
  previous_school: string;
  status: 'signed' | 'verbal' | 'committed';
}

interface ProgramValue {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  year?: string;
}

interface StaffMember {
  id: string;
  fullName: string;
  title: string;
  roleFocus?: string;
  avatarUrl?: string;
  shortBio?: string;
  email?: string;
  phone?: string;
  recruitingRegions?: string[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

type TabType = 'about' | 'staff' | 'facilities' | 'camps' | 'commitments' | 'values';

// ═══════════════════════════════════════════════════════════════════════════
// Sample Data
// ═══════════════════════════════════════════════════════════════════════════

const SAMPLE_FACILITIES: Facility[] = [
  { id: '1', name: 'Stadium', description: 'Modern 5,000 seat facility with full lighting', stats: '5,000 seats • Artificial turf' },
  { id: '2', name: 'Indoor Facility', description: 'Year-round training facility with batting cages', stats: '15,000 sq ft' },
  { id: '3', name: 'Weight Room', description: 'State-of-the-art strength training center', stats: 'Olympic platforms • Recovery area' },
  { id: '4', name: 'Locker Room', description: 'Recently renovated player facilities', stats: 'Individual lockers • Players lounge' },
];

const SAMPLE_COMMITMENTS: Commitment[] = [
  { id: '1', name: 'Marcus Thompson', position: 'RHP', grad_year: 2025, hometown: 'Dallas, TX', previous_school: 'Dallas Christian', status: 'signed' },
  { id: '2', name: 'Jake Rodriguez', position: 'C', grad_year: 2025, hometown: 'Miami, FL', previous_school: 'Miami Central', status: 'verbal' },
  { id: '3', name: 'Brandon Lee', position: 'SS', grad_year: 2026, hometown: 'Los Angeles, CA', previous_school: 'Mater Dei', status: 'committed' },
];

const SAMPLE_VALUES: ProgramValue[] = [
  { id: '1', title: 'Excellence', description: 'We strive for excellence in everything we do, on and off the field.', icon: 'star' },
  { id: '2', title: 'Integrity', description: 'We do the right thing, even when no one is watching.', icon: 'heart' },
  { id: '3', title: 'Brotherhood', description: 'We are a family that supports each other through every challenge.', icon: 'users' },
  { id: '4', title: 'Development', description: 'We develop players for success at the next level and in life.', icon: 'trophy' },
];

const SAMPLE_TESTIMONIALS: Testimonial[] = [
  { id: '1', quote: 'The coaching staff here truly cares about developing you as a person first, player second. Best decision I ever made.', author: 'Tyler Brooks', role: 'Current Player', year: '2025' },
  { id: '2', quote: 'The facilities and training here prepared me perfectly for professional baseball. Forever grateful.', author: 'Chris Miller', role: 'Alumni', year: '2022' },
];

const SAMPLE_STAFF: StaffMember[] = [
  {
    id: '1',
    fullName: 'Nicholas Rini',
    title: 'Head Coach',
    roleFocus: 'Program Direction',
    shortBio: 'Coach Rini brings 15+ years of collegiate coaching experience. Former Division I player and MLB scout.',
    email: 'nrini@maine.edu',
    recruitingRegions: ['Northeast', 'Mid-Atlantic'],
    socialLinks: { twitter: 'https://twitter.com/coachrini' },
  },
  {
    id: '2',
    fullName: 'Mike Johnson',
    title: 'Associate Head Coach',
    roleFocus: 'Hitting',
    shortBio: 'Developed 12 MLB draft picks over his career. Specializes in swing mechanics and approach.',
    email: 'mjohnson@maine.edu',
    recruitingRegions: ['Southeast', 'Florida'],
  },
  {
    id: '3',
    fullName: 'David Chen',
    title: 'Pitching Coach',
    roleFocus: 'Pitching Development',
    shortBio: 'Former professional pitcher with 8 years of minor league experience. Analytics-driven approach.',
    email: 'dchen@maine.edu',
    recruitingRegions: ['West Coast', 'Texas'],
    socialLinks: { twitter: 'https://twitter.com/coachchen' },
  },
  {
    id: '4',
    fullName: 'Sarah Martinez',
    title: 'Recruiting Coordinator',
    roleFocus: 'Recruiting Operations',
    shortBio: 'Manages all recruiting communications and campus visits. Expert in prospect evaluation.',
    email: 'smartinez@maine.edu',
    phone: '(207) 555-0123',
    recruitingRegions: ['National'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Theme Utilities
// ═══════════════════════════════════════════════════════════════════════════

// Darken a hex color by a percentage
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

type ThemeStyles = {
  banner: { background: string };
  bannerOverlay: { background: string };
  accent: string;
  accentBg: string;
  accentBorder: string;
  text: string;
  textMuted: string;
  cardBg: string;
  tabActive: { backgroundColor: string; borderColor: string; color: string };
};

function getThemeStyles(primaryColor: string, secondaryColor: string, isDark: boolean): ThemeStyles {
  const primary = primaryColor || '#00C27A';
  const secondary = secondaryColor || '#003B2A';
  
  return {
    banner: {
      background: `linear-gradient(135deg, ${secondary} 0%, ${primary}20 50%, ${secondary} 100%)`,
    },
    bannerOverlay: {
      background: `radial-gradient(ellipse at 30% 40%, ${primary}15 0%, transparent 50%)`,
    },
    accent: primary,
    accentBg: `${primary}15`,
    accentBorder: `${primary}40`,
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/95 border-slate-200/60 shadow-lg',
    tabActive: { backgroundColor: `${primary}20`, borderColor: primary, color: primary },
  };
}

interface SectionProps {
  coach?: Coach | null;
  editForm?: {
    about: string;
    program_values: string;
    what_we_look_for: string;
    academic_profile: string;
    facility_summary: string;
    tagline: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    use_dark_mode: boolean;
    twitter_url: string;
    instagram_url: string;
    youtube_url: string;
    program_website: string;
  };
  setEditForm?: React.Dispatch<React.SetStateAction<{
    about: string;
    program_values: string;
    what_we_look_for: string;
    academic_profile: string;
    facility_summary: string;
    tagline: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    use_dark_mode: boolean;
    twitter_url: string;
    instagram_url: string;
    youtube_url: string;
    program_website: string;
  }>>;
  editingSection?: string | null;
  setEditingSection?: React.Dispatch<React.SetStateAction<string | null>>;
  handleSave?: (fields: Partial<{
    about: string;
    program_values: string;
    what_we_look_for: string;
    academic_profile: string;
    facility_summary: string;
    tagline: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    use_dark_mode: boolean;
    twitter_url: string;
    instagram_url: string;
    youtube_url: string;
    program_website: string;
  }>) => Promise<void>;
  saving?: boolean;
  isPreviewMode?: boolean;
  theme?: ThemeStyles;
  isDark?: boolean;
  camps?: CampEvent[];
  programColor?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function CollegeCoachProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [camps, setCamps] = useState<CampEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  
  // Edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    about: '',
    program_values: '',
    what_we_look_for: '',
    academic_profile: '',
    facility_summary: '',
    tagline: '',
    primary_color: '#00C27A',
    secondary_color: '#003B2A',
    accent_color: '',
    use_dark_mode: false,
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    program_website: '',
  });

  // Derived theme
  const isDark = editForm.use_dark_mode;
  const theme = useMemo(() => 
    getThemeStyles(editForm.primary_color, editForm.secondary_color, isDark),
    [editForm.primary_color, editForm.secondary_color, isDark]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    let coachId: string | null = null;
    let coachData = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
      const { data } = await supabase.from('coaches').select('*').eq('id', coachId).single();
      coachData = data;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('coaches').select('*').eq('user_id', user.id).single();
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
        tagline: coachData.tagline || '',
        primary_color: coachData.primary_color || '#00C27A',
        secondary_color: coachData.secondary_color || '#003B2A',
        accent_color: coachData.accent_color || '',
        use_dark_mode: coachData.use_dark_mode || false,
        twitter_url: coachData.twitter_url || '',
        instagram_url: coachData.instagram_url || '',
        youtube_url: coachData.youtube_url || '',
        program_website: coachData.program_website || '',
      });

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
            status: (['open', 'limited', 'full'] as const)[Math.floor(Math.random() * 3)],
          }));
          setCamps(campsWithCounts);
        }
      }
    }
    setLoading(false);
  };

  const handleSave = async (fields: Partial<typeof editForm>) => {
    if (!coach) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('coaches')
      .update(fields)
      .eq('id', coach.id);

    if (error) {
      toast.error('Failed to save changes');
    } else {
      toast.success('Changes saved!');
      setCoach({ ...coach, ...fields } as Coach);
      setEditingSection(null);
    }
    setSaving(false);
  };

  const handleSaveTheme = async () => {
    await handleSave({
      primary_color: editForm.primary_color,
      secondary_color: editForm.secondary_color,
      accent_color: editForm.accent_color,
      use_dark_mode: editForm.use_dark_mode,
    });
    setShowThemeEditor(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!coach) return null;

  const programName = coach.school_name || coach.program_name || 'Your Program';
  const location = coach.school_city && coach.school_state ? `${coach.school_city}, ${coach.school_state}` : null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'About', icon: <Building className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff', icon: <Users className="w-4 h-4" /> },
    { id: 'facilities', label: 'Facilities', icon: <Home className="w-4 h-4" /> },
    { id: 'camps', label: 'Camps & Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'commitments', label: 'Commitments', icon: <Trophy className="w-4 h-4" /> },
    { id: 'values', label: 'Values & Culture', icon: <Heart className="w-4 h-4" /> },
  ];

  // Program colors for accents
  const programColor = editForm.primary_color || '#00C46F';
  const programInitials = programName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-background via-background to-muted/30'}`}>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO BANNER - Themeable with Program Colors
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${editForm.secondary_color || '#0A3B2E'} 0%, ${darkenColor(editForm.secondary_color || '#0A3B2E', 20)} 40%, ${darkenColor(editForm.secondary_color || '#0A3B2E', 40)} 100%)`,
        }}
      >
        {/* Subtle radial glow using program color */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 20% 30%, ${programColor}20, transparent 60%)`,
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Vignette effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Floating Logo Badge with Glow */}
            <div className="relative group">
              <div 
                className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"
                style={{ background: programColor }}
              />
              <Avatar className="relative h-20 w-20 md:h-24 md:w-24 ring-4 ring-white/20 shadow-2xl rounded-2xl">
                <AvatarImage src={coach?.logo_url ?? undefined} className="rounded-2xl object-cover" />
                <AvatarFallback 
                  className="rounded-2xl text-2xl md:text-3xl font-bold text-white"
                  style={{ background: programColor }}
                >
                  {programInitials}
                </AvatarFallback>
              </Avatar>
              {!isPreviewMode && (
                <button 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => toast.info('Logo upload coming soon')}
                >
                  <Upload className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            {/* Program Info Card - Glassmorphism */}
            <div className="flex-1 min-w-0">
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 md:p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{programName}</h1>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                <p className="text-white/70 text-sm">
                  {coach.program_division || 'D1'} · {coach.athletic_conference || 'Set Conference'}
                  {location && ` · ${location}`}
                </p>
                
                {coach.full_name && (
                  <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {coach.full_name}{coach.staff_role && ` — ${coach.staff_role}`}
                  </p>
                )}
                
                {editForm.tagline && (
                  <p className="text-white/40 text-xs italic mt-3 line-clamp-1">
                    "{editForm.tagline}"
                  </p>
                )}
              
                {/* Social Links */}
                {(editForm.twitter_url || editForm.instagram_url || editForm.youtube_url || editForm.program_website) && (
                  <div className="flex items-center gap-2 mt-3">
                    {editForm.twitter_url && (
                      <a href={editForm.twitter_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <Twitter className="w-3.5 h-3.5 text-white/60" />
                      </a>
                    )}
                    {editForm.instagram_url && (
                      <a href={editForm.instagram_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <Instagram className="w-3.5 h-3.5 text-white/60" />
                      </a>
                    )}
                    {editForm.youtube_url && (
                      <a href={editForm.youtube_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <Youtube className="w-3.5 h-3.5 text-white/60" />
                      </a>
                    )}
                    {editForm.program_website && (
                      <a href={editForm.program_website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <Globe className="w-3.5 h-3.5 text-white/60" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isPreviewMode ? (
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => setShowThemeEditor(true)}
                  className="flex-1 md:flex-none h-10 gap-2 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
                  style={{ background: programColor }}
                >
                  <Palette className="w-4 h-4" />
                  Theme
                </Button>
                <Button
                  onClick={() => setIsPreviewMode(true)}
                  variant="outline"
                  className="flex-1 md:flex-none h-10 gap-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => setIsPreviewMode(false)}
                  className="flex-1 md:flex-none h-10 gap-2 bg-white text-slate-800 hover:bg-white/90 text-sm"
                >
                  <EyeOff className="w-4 h-4" />
                  Exit Preview
                </Button>
                <Button 
                  className="gap-2 text-white border border-white/30"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Heart className="w-4 h-4" />
                  Follow Program
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'text-white shadow-sm' 
                    : `${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`
                  }
                `}
                style={activeTab === tab.id ? { backgroundColor: theme.accent } : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <AboutSection
              coach={coach}
              editForm={editForm}
              setEditForm={setEditForm}
              editingSection={editingSection}
              setEditingSection={setEditingSection}
              handleSave={handleSave}
              saving={saving}
              isPreviewMode={isPreviewMode}
              theme={theme}
              isDark={isDark}
            />
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <StaffSection
            isPreviewMode={isPreviewMode}
            theme={theme}
            isDark={isDark}
            programColor={programColor}
          />
        )}

        {/* FACILITIES TAB */}
        {activeTab === 'facilities' && (
          <FacilitiesSection
            coach={coach}
            editForm={editForm}
            setEditForm={setEditForm}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            handleSave={handleSave}
            saving={saving}
            isPreviewMode={isPreviewMode}
            theme={theme}
            isDark={isDark}
          />
        )}

        {/* CAMPS TAB */}
        {activeTab === 'camps' && (
          <CampsSection
            camps={camps}
            isPreviewMode={isPreviewMode}
            theme={theme}
            isDark={isDark}
          />
        )}

        {/* COMMITMENTS TAB */}
        {activeTab === 'commitments' && (
          <CommitmentsSection
            isPreviewMode={isPreviewMode}
            theme={theme}
            isDark={isDark}
          />
        )}

        {/* VALUES TAB */}
        {activeTab === 'values' && (
          <ValuesSection
            coach={coach}
            editForm={editForm}
            setEditForm={setEditForm}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            handleSave={handleSave}
            saving={saving}
            isPreviewMode={isPreviewMode}
            theme={theme}
            isDark={isDark}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          THEME EDITOR MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showThemeEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${theme.text}`}>Brand & Theme</h2>
                <button onClick={() => setShowThemeEditor(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Preview Banner */}
              <div>
                <label className={`text-sm font-medium ${theme.textMuted}`}>Preview</label>
                <div 
                  className="mt-2 h-24 rounded-xl flex items-center justify-center"
                  style={{ background: theme.banner.background }}
                >
                  <span className="text-white/80 text-sm">Banner Preview</span>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.primary_color || '#00C27A'}
                      onChange={(e) => setEditForm({ ...editForm, primary_color: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <Input
                      value={editForm.primary_color || '#00C27A'}
                      onChange={(e) => setEditForm({ ...editForm, primary_color: e.target.value })}
                      className={`flex-1 h-10 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.secondary_color || '#003B2A'}
                      onChange={(e) => setEditForm({ ...editForm, secondary_color: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <Input
                      value={editForm.secondary_color || '#003B2A'}
                      onChange={(e) => setEditForm({ ...editForm, secondary_color: e.target.value })}
                      className={`flex-1 h-10 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${theme.text}`}>Dark Mode</p>
                  <p className={`text-sm ${theme.textMuted}`}>Use dark background for program page</p>
                </div>
                <button
                  onClick={() => setEditForm({ ...editForm, use_dark_mode: !editForm.use_dark_mode })}
                  className={`w-12 h-7 rounded-full transition-colors ${editForm.use_dark_mode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${editForm.use_dark_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Tagline */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Tagline</label>
                <Input
                    value={editForm.tagline || ''}
                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  placeholder="Building champions on and off the field"
                  className={isDark ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <label className={`block text-sm font-medium ${theme.textMuted}`}>Social Links</label>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-slate-400" />
                  <Input
                    value={editForm.twitter_url || ''}
                    onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                    placeholder="https://twitter.com/yourprogram"
                    className={`flex-1 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-slate-400" />
                  <Input
                    value={editForm.instagram_url || ''}
                    onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/yourprogram"
                    className={`flex-1 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <Button variant="outline" onClick={() => setShowThemeEditor(false)}>Cancel</Button>
              <Button onClick={handleSaveTheme} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">
                {saving ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Theme
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT SECTION
// ═══════════════════════════════════════════════════════════════════════════

function AboutSection({ coach, editForm, setEditForm, editingSection, setEditingSection, handleSave, saving, isPreviewMode, theme, isDark }: SectionProps) {
  if (!theme || !editForm || !setEditForm || !setEditingSection) return null;
  if (!coach) return null;
  
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* About */}
        <Card className={theme.cardBg}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-lg ${theme.text}`}>About the Program</CardTitle>
            {!isPreviewMode && editingSection !== 'about' && (
              <Button size="sm" variant="ghost" onClick={() => setEditingSection('about')}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSection === 'about' ? (
              <div className="space-y-3">
                <Textarea
                  value={editForm.about || ''}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  placeholder="Tell recruits about your program's history, achievements, and what makes it special..."
                  className={`min-h-[150px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleSave?.({ about: editForm.about })} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">
                    {saving ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse" /> : 'Save'}
                  </Button>
                </div>
              </div>
            ) : editForm.about ? (
              <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{editForm.about}</p>
            ) : (
              <div className={`text-center py-8 ${theme.textMuted}`}>
                <p>No description added yet</p>
                {!isPreviewMode && (
                  <Button onClick={() => setEditingSection('about')} className="mt-4" style={{ backgroundColor: theme.accent }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Description
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* What We Look For */}
        <Card className={theme.cardBg}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-lg ${theme.text}`}>What We Look For</CardTitle>
            {!isPreviewMode && editingSection !== 'look_for' && (
              <Button size="sm" variant="ghost" onClick={() => setEditingSection('look_for')}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSection === 'look_for' ? (
              <div className="space-y-3">
                <Textarea
                  value={editForm.what_we_look_for || ''}
                  onChange={(e) => setEditForm({ ...editForm, what_we_look_for: e.target.value })}
                  placeholder="What qualities and skills are you looking for in recruits?"
                  className={`min-h-[120px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleSave?.({ what_we_look_for: editForm.what_we_look_for })} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">
                    {saving ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse" /> : 'Save'}
                  </Button>
                </div>
              </div>
            ) : editForm.what_we_look_for ? (
              <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{editForm.what_we_look_for}</p>
            ) : (
              <div className={`text-center py-8 ${theme.textMuted}`}>
                <p>Tell recruits what you're looking for</p>
                {!isPreviewMode && (
                  <Button onClick={() => setEditingSection('look_for')} className="mt-4" style={{ backgroundColor: theme.accent }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Details
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Info */}
        <Card className={theme.cardBg}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg ${theme.text}`}>Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coach.program_division && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accentBg }}>
                  <Trophy className="w-4 h-4" style={{ color: theme.accent }} />
                </div>
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Division</p>
                  <p className={`font-medium ${theme.text}`}>{coach.program_division}</p>
                </div>
              </div>
            )}
            {coach.athletic_conference && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accentBg }}>
                  <Award className="w-4 h-4" style={{ color: theme.accent }} />
                </div>
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Conference</p>
                  <p className={`font-medium ${theme.text}`}>{coach.athletic_conference}</p>
                </div>
              </div>
            )}
            {(coach.school_city || coach.school_state) && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accentBg }}>
                  <MapPin className="w-4 h-4" style={{ color: theme.accent }} />
                </div>
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Location</p>
                  <p className={`font-medium ${theme.text}`}>{coach.school_city}, {coach.school_state}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className={theme.cardBg}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg ${theme.text}`}>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coach.email_contact && (
              <a href={`mailto:${coach.email_contact}`} className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <span className={`text-sm group-hover:underline ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.email_contact}</span>
              </a>
            )}
            {coach.phone_contact && (
              <a href={`tel:${coach.phone_contact}`} className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Phone className="w-4 h-4 text-green-500" />
                </div>
                <span className={`text-sm group-hover:underline ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{coach.phone_contact}</span>
              </a>
            )}
          </CardContent>
        </Card>

        {/* Academics */}
        <Card className={theme.cardBg}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Academics
            </CardTitle>
            {!isPreviewMode && editingSection !== 'academic' && (
              <Button size="sm" variant="ghost" onClick={() => setEditingSection('academic')}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSection === 'academic' ? (
              <div className="space-y-3">
                <Textarea
                  value={editForm.academic_profile || ''}
                  onChange={(e) => setEditForm({ ...editForm, academic_profile: e.target.value })}
                  placeholder="Academic programs, support, and requirements..."
                  className={`min-h-[100px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleSave?.({ academic_profile: editForm.academic_profile })} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">Save</Button>
                </div>
              </div>
            ) : editForm.academic_profile ? (
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{editForm.academic_profile}</p>
            ) : (
              <p className={`text-sm ${theme.textMuted}`}>No academic info added</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FACILITIES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function FacilitiesSection({ coach, editForm, setEditForm, editingSection, setEditingSection, handleSave, saving, isPreviewMode, theme, isDark }: SectionProps) {
  if (!theme || !editForm || !setEditForm || !setEditingSection) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${theme.text}`}>Our Facilities</h2>
          <p className={theme.textMuted}>Take a virtual tour of our world-class facilities</p>
        </div>
        {!isPreviewMode && (
          <Button style={{ backgroundColor: theme.accent }} className="text-white" onClick={() => toast.info('Facility manager coming soon')}>
            <Settings2 className="w-4 h-4 mr-2" /> Manage Facilities
          </Button>
        )}
      </div>

      {/* Description */}
      {(editForm.facility_summary || !isPreviewMode) && (
        <Card className={theme.cardBg}>
          <CardContent className="pt-6">
            {editingSection === 'facility_desc' ? (
              <div className="space-y-3">
                <Textarea
                  value={editForm.facility_summary || ''}
                  onChange={(e) => setEditForm({ ...editForm, facility_summary: e.target.value })}
                  placeholder="Describe your facilities..."
                  className={`min-h-[100px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleSave?.({ facility_summary: editForm.facility_summary })} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">Save</Button>
                </div>
              </div>
            ) : editForm.facility_summary ? (
              <div className="flex items-start justify-between">
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{editForm.facility_summary}</p>
                {!isPreviewMode && (
                  <Button size="sm" variant="ghost" onClick={() => setEditingSection('facility_desc')}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : !isPreviewMode && (
              <Button onClick={() => setEditingSection('facility_desc')} variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Facility Description
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Facility Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {SAMPLE_FACILITIES.map((facility) => (
          <Card key={facility.id} className={`overflow-hidden group ${theme.cardBg}`}>
            <div className={`aspect-video flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Camera className={`w-12 h-12 ${theme.textMuted}`} />
            </div>
            <CardContent className="p-4">
              <h3 className={`font-semibold ${theme.text}`}>{facility.name}</h3>
              <p className={`text-sm mt-1 ${theme.textMuted}`}>{facility.description}</p>
              {facility.stats && (
                <p className="text-xs mt-2" style={{ color: theme.accent }}>{facility.stats}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Section */}
      <Card className={theme.cardBg}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme.text}`}>
            <Video className="w-5 h-5 text-rose-500" />
            Program Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coach?.intro_video_url ? (
            <div className={`aspect-video rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Play className={`w-16 h-16 ${theme.textMuted}`} />
            </div>
          ) : (
            <div className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>
              <Video className={`w-12 h-12 mb-2 ${theme.textMuted}`} />
              <p className={theme.textMuted}>No video uploaded</p>
              {!isPreviewMode && (
                <Button className="mt-4" variant="outline" onClick={() => toast.info('Video upload coming soon')}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Video
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function CampsSection({ camps, isPreviewMode, theme, isDark }: SectionProps) {
  if (!theme) return null;
  const campsList = camps || [];
  
  const statusColors = {
    open: 'bg-green-500/10 text-green-600 border-green-500/30',
    limited: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    full: 'bg-red-500/10 text-red-600 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${theme.text}`}>Camps & Events</h2>
          <p className={theme.textMuted}>Upcoming events hosted by our program</p>
        </div>
        {!isPreviewMode && (
          <Link href="/coach/college/camps?action=create">
            <Button style={{ backgroundColor: theme.accent }} className="text-white">
              <Plus className="w-4 h-4 mr-2" /> Create Camp
            </Button>
          </Link>
        )}
      </div>

      {campsList.length === 0 ? (
        <Card className={theme.cardBg}>
          <CardContent className="py-16 text-center">
            <Calendar className={`w-12 h-12 mx-auto mb-4 ${theme.textMuted}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme.text}`}>No Upcoming Events</h3>
            <p className={theme.textMuted}>Check back soon for camps and showcase events</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campsList.map((camp: CampEvent) => (
            <Card key={camp.id} className={`overflow-hidden ${theme.cardBg}`}>
              <div className="h-1" style={{ backgroundColor: theme.accent }} />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${theme.text}`}>{camp.name}</h3>
                      <Badge variant="outline" className={statusColors[camp.status || 'open']}>
                        {(camp.status || 'open').toUpperCase()}
                      </Badge>
                    </div>
                    <div className={`flex flex-wrap gap-4 text-sm ${theme.textMuted}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(camp.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                      <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{camp.description}</p>
                    )}
                  </div>
                  
                  {isPreviewMode ? (
                    <Button style={{ backgroundColor: theme.accent }} className="text-white">
                      <Heart className="w-4 h-4 mr-2" /> Interested
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href={`/coach/college/camps?camp=${camp.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </Button>
                      </Link>
                      <Link href={`/coach/college/calendar`}>
                        <Button variant="ghost" size="sm" className="w-full">
                          <Calendar className="w-4 h-4 mr-2" /> View in Calendar
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMITMENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function CommitmentsSection({ isPreviewMode, theme, isDark }: SectionProps) {
  if (!theme) return null;
  
  const statusBadge = {
    signed: 'bg-green-500/10 text-green-600 border-green-500/30',
    verbal: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    committed: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${theme.text}`}>Commitment History</h2>
          <p className={theme.textMuted}>Recent additions to our program</p>
        </div>
        {!isPreviewMode && (
          <Button style={{ backgroundColor: theme.accent }} className="text-white" onClick={() => toast.info('Commitment manager coming soon')}>
            <Plus className="w-4 h-4 mr-2" /> Add Commitment
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>All Years</Badge>
        <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>2025</Badge>
        <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>2026</Badge>
        <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>Pitchers</Badge>
        <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>Position Players</Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_COMMITMENTS.map((commit) => (
          <Card key={commit.id} className={theme.cardBg}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                    {commit.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold truncate ${theme.text}`}>{commit.name}</h4>
                    <Badge variant="outline" className={statusBadge[commit.status]}>
                      {commit.status}
                    </Badge>
                  </div>
                  <p className={`text-sm ${theme.textMuted}`}>{commit.position} • {commit.grad_year}</p>
                  <p className={`text-xs mt-1 ${theme.textMuted}`}>{commit.hometown}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{commit.previous_school}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VALUES & CULTURE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function ValuesSection({ coach, editForm, setEditForm, editingSection, setEditingSection, handleSave, saving, isPreviewMode, theme, isDark }: SectionProps) {
  if (!theme || !editForm || !setEditForm || !setEditingSection) return null;
  if (!coach) return null;
  
  const iconMap: Record<string, React.ReactNode> = {
    star: <Star className="w-5 h-5" />,
    heart: <Heart className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    trophy: <Trophy className="w-5 h-5" />,
  };

  return (
    <div className="space-y-8">
      {/* Program Values */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-semibold ${theme.text}`}>Our Core Values</h2>
            <p className={theme.textMuted}>The principles that guide our program</p>
          </div>
          {!isPreviewMode && (
            <Button variant="outline" onClick={() => toast.info('Values editor coming soon')}>
              <Settings2 className="w-4 h-4 mr-2" /> Manage Values
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {SAMPLE_VALUES.map((value) => (
            <Card key={value.id} className={theme.cardBg}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: theme.accentBg }}>
                  <span style={{ color: theme.accent }}>{iconMap[value.icon || 'star']}</span>
                </div>
                <div>
                  <h4 className={`font-semibold ${theme.text}`}>{value.title}</h4>
                  <p className={`text-sm mt-1 ${theme.textMuted}`}>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Program Culture */}
      <Card className={theme.cardBg}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={`text-lg ${theme.text}`}>Program Culture</CardTitle>
          {!isPreviewMode && editingSection !== 'culture' && (
            <Button size="sm" variant="ghost" onClick={() => setEditingSection('culture')}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingSection === 'culture' ? (
            <div className="space-y-3">
              <Textarea
                value={editForm.program_values || ''}
                onChange={(e) => setEditForm({ ...editForm, program_values: e.target.value })}
                placeholder="Describe your program's culture and what players can expect..."
                className={`min-h-[120px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                <Button size="sm" onClick={() => handleSave?.({ program_values: editForm.program_values })} disabled={saving} style={{ backgroundColor: theme.accent }} className="text-white">Save</Button>
              </div>
            </div>
          ) : editForm.program_values ? (
            <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{editForm.program_values}</p>
          ) : (
            <div className={`text-center py-6 ${theme.textMuted}`}>
              <p>Describe what makes your program culture unique</p>
              {!isPreviewMode && (
                <Button onClick={() => setEditingSection('culture')} className="mt-4" style={{ backgroundColor: theme.accent }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Culture Info
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonials */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-semibold ${theme.text}`}>Player Testimonials</h2>
            <p className={theme.textMuted}>Hear from current and former players</p>
          </div>
          {!isPreviewMode && (
            <Button variant="outline" onClick={() => toast.info('Testimonials editor coming soon')}>
              <Plus className="w-4 h-4 mr-2" /> Add Testimonial
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {SAMPLE_TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.id} className={theme.cardBg}>
              <CardContent className="p-6">
                <Quote className="w-8 h-8 mb-3" style={{ color: theme.accent, opacity: 0.5 }} />
                <p className={`italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{testimonial.quote}"
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`font-medium ${theme.text}`}>{testimonial.author}</p>
                    <p className={`text-sm ${theme.textMuted}`}>{testimonial.role} {testimonial.year && `• ${testimonial.year}`}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAFF SECTION
// ═══════════════════════════════════════════════════════════════════════════

function StaffSection({ isPreviewMode, theme, isDark, programColor }: { 
  isPreviewMode: boolean; 
  theme: ThemeStyles; 
  isDark: boolean;
  programColor: string;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>(SAMPLE_STAFF);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${theme.text}`}>Coaching Staff</h2>
          <p className={theme.textMuted}>Meet the team behind your success</p>
        </div>
        {!isPreviewMode && (
          <Button 
            onClick={() => toast.info('Staff editor coming soon')}
            style={{ backgroundColor: programColor }} 
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Staff Member
          </Button>
        )}
      </div>

      {/* Staff Grid */}
      {staff.length === 0 ? (
        <Card className={theme.cardBg}>
          <CardContent className="py-16 text-center">
            <Users className={`w-12 h-12 mx-auto mb-4 ${theme.textMuted}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme.text}`}>No Staff Added Yet</h3>
            <p className={`mb-6 ${theme.textMuted}`}>Show recruits who leads your program</p>
            {!isPreviewMode && (
              <Button onClick={() => toast.info('Staff editor coming soon')} style={{ backgroundColor: programColor }} className="text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Staff Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card 
              key={member.id} 
              className={`group transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${theme.cardBg}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div 
                    className="rounded-full p-0.5"
                    style={{ background: `linear-gradient(135deg, ${programColor}40, ${programColor}10)` }}
                  >
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback 
                        className="text-lg font-semibold text-white"
                        style={{ backgroundColor: programColor }}
                      >
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${theme.text}`}>{member.fullName}</h3>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {member.title}
                          {member.roleFocus && ` • ${member.roleFocus}`}
                        </p>
                      </div>
                      {!isPreviewMode && (
                        <button 
                          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          onClick={() => toast.info('Edit staff coming soon')}
                        >
                          <Edit className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Bio */}
                    {member.shortBio && (
                      <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {member.shortBio}
                      </p>
                    )}

                    {/* Recruiting Regions */}
                    {member.recruitingRegions && member.recruitingRegions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {member.recruitingRegions.map((region) => (
                          <Badge 
                            key={region} 
                            variant="outline" 
                            className={`text-xs ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-500'}`}
                          >
                            {region}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Contact Row */}
                    <div className="flex items-center gap-2 mt-3">
                      {member.email && (
                        <a 
                          href={`mailto:${member.email}`}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          title="Email"
                        >
                          <Mail className="w-4 h-4" style={{ color: programColor }} />
                        </a>
                      )}
                      {member.phone && (
                        <a 
                          href={`tel:${member.phone}`}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          title="Phone"
                        >
                          <Phone className="w-4 h-4" style={{ color: programColor }} />
                        </a>
                      )}
                      {member.socialLinks?.twitter && (
                        <a 
                          href={member.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          title="Twitter"
                        >
                          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                        </a>
                      )}
                      {member.socialLinks?.instagram && (
                        <a 
                          href={member.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4 text-[#E4405F]" />
                        </a>
                      )}
                      {member.socialLinks?.website && (
                        <a 
                          href={member.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          title="Website"
                        >
                          <Globe className="w-4 h-4" style={{ color: programColor }} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
