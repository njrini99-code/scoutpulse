'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  Info,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Video,
  Calendar,
  Users,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface PrivacySettings {
  contact_info?: boolean;
  address?: boolean;
  gpa?: boolean;
  stats?: boolean;
  videos?: boolean;
  team_history?: boolean;
  availability?: boolean;
  family_info?: boolean;
}

export function PlayerVisibilitySettings({ settings }: { settings: any }) {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    contact_info: false,
    address: false,
    gpa: true,
    stats: true,
    videos: true,
    team_history: true,
    availability: true,
    family_info: false,
    ...settings?.privacy_settings
  });
  const [saving, setSaving] = useState(false);

  const togglePrivacy = (field: keyof PrivacySettings) => {
    setPrivacySettings({
      ...privacySettings,
      [field]: !privacySettings[field]
    });
  };

  const handleSavePrivacySettings = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('players')
        .update({
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    {
      field: 'contact_info' as keyof PrivacySettings,
      label: 'Contact Information',
      description: 'Email, Phone',
      icon: Mail,
      default: false
    },
    {
      field: 'address' as keyof PrivacySettings,
      label: 'Full Address',
      description: 'Complete location details',
      icon: MapPin,
      default: false
    },
    {
      field: 'gpa' as keyof PrivacySettings,
      label: 'GPA & Academic Info',
      description: 'Grades and academic performance',
      icon: GraduationCap,
      default: true
    },
    {
      field: 'stats' as keyof PrivacySettings,
      label: 'Statistics',
      description: 'Performance metrics and stats',
      icon: Users,
      default: true
    },
    {
      field: 'videos' as keyof PrivacySettings,
      label: 'Video Highlights',
      description: 'Game footage and highlights',
      icon: Video,
      default: true
    },
    {
      field: 'team_history' as keyof PrivacySettings,
      label: 'Team History',
      description: 'Past teams and career progression',
      icon: Home,
      default: true
    },
    {
      field: 'availability' as keyof PrivacySettings,
      label: 'Availability Calendar',
      description: 'When you\'re available for events',
      icon: Calendar,
      default: true
    },
    {
      field: 'family_info' as keyof PrivacySettings,
      label: 'Family Information',
      description: 'Family background and support',
      icon: Users,
      default: false
    }
  ];

  return (
    <Card className="bg-slate-900/70 border-white/5 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Privacy & Visibility
        </CardTitle>
        <p className="text-sm text-slate-400">
          Control what information is visible to coaches on your public profile.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {privacyOptions.map((option) => {
          const Icon = option.icon;
          const isVisible = privacySettings[option.field] ?? option.default;

          return (
            <div
              key={option.field}
              className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isVisible ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                }`}>
                  <Icon className={`w-5 h-5 ${isVisible ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-slate-400">{option.description}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isVisible ? 'Visible to coaches' : 'Private'}
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => togglePrivacy(option.field)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          );
        })}

        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <strong>Note:</strong> Your name, position, graduation year, and location are always visible to help coaches find you. Everything else can be controlled here.
            </div>
          </div>
        </div>

        <Button
          onClick={handleSavePrivacySettings}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
