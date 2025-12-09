'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building,
  MapPin,
  Trophy,
  Users,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  Video,
  Play,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  name: string;
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
  coaches?: {
    full_name: string;
    email?: string;
    phone?: string;
  }[];
}

export default function ProgramPage() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const programId = params.id as string;

  useEffect(() => {
    async function loadProgram() {
      if (!programId) return;

      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch program/coach data
        const { data: programData, error: programError } = await supabase
          .from('coaches')
          .select(`
            id,
            program_name,
            logo_url,
            about,
            program_values,
            what_we_look_for,
            academic_profile,
            facility_summary,
            tagline,
            primary_color,
            secondary_color,
            accent_color,
            twitter_url,
            instagram_url,
            youtube_url,
            program_website,
            users (
              full_name,
              email,
              phone
            )
          `)
          .eq('id', programId)
          .single();

        if (programError) throw programError;

        setProgram({
          id: programData.id,
          name: programData.program_name || 'Program',
          logo_url: programData.logo_url,
          about: programData.about,
          program_values: programData.program_values,
          what_we_look_for: programData.what_we_look_for,
          academic_profile: programData.academic_profile,
          facility_summary: programData.facility_summary,
          tagline: programData.tagline,
          primary_color: programData.primary_color,
          secondary_color: programData.secondary_color,
          accent_color: programData.accent_color,
          twitter_url: programData.twitter_url,
          instagram_url: programData.instagram_url,
          youtube_url: programData.youtube_url,
          program_website: programData.program_website,
          coaches: programData.users ? [{
            full_name: (programData.users as any).full_name || '',
            email: (programData.users as any).email,
            phone: (programData.users as any).phone
          }] : []
        });
      } catch (err) {
        console.error('Error loading program:', err);
        setError('Failed to load program information');
        toast.error('Failed to load program information');
      } finally {
        setLoading(false);
      }
    }

    loadProgram();
  }, [programId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading program...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Program Not Found</h1>
          <p className="text-slate-600 mb-6">{error || 'The program you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-6">
            {/* Program Logo */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {program.logo_url ? (
                <img
                  src={program.logo_url}
                  alt={`${program.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                  <Building className="w-10 h-10 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Program Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{program.name}</h1>
              {program.tagline && (
                <p className="text-lg text-slate-600 mb-4">{program.tagline}</p>
              )}

              {/* Social Links */}
              <div className="flex gap-3">
                {program.program_website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={program.program_website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
                {program.twitter_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={program.twitter_url} target="_blank" rel="noopener noreferrer">
                      <span className="w-4 h-4 mr-2">𝕏</span>
                      Twitter
                    </a>
                  </Button>
                )}
                {program.instagram_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={program.instagram_url} target="_blank" rel="noopener noreferrer">
                      <span className="w-4 h-4 mr-2">📷</span>
                      Instagram
                    </a>
                  </Button>
                )}
                {program.youtube_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={program.youtube_url} target="_blank" rel="noopener noreferrer">
                      <Play className="w-4 h-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {program.about && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    About the Program
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{program.about}</p>
                </CardContent>
              </Card>
            )}

            {/* What We Look For */}
            {program.what_we_look_for && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    What We Look For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{program.what_we_look_for}</p>
                </CardContent>
              </Card>
            )}

            {/* Academic Profile */}
            {program.academic_profile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Academic Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{program.academic_profile}</p>
                </CardContent>
              </Card>
            )}

            {/* Facilities */}
            {program.facility_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{program.facility_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Program Values */}
            {program.program_values && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Program Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{program.program_values}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Contact Coach */}
            {program.coaches && program.coaches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contact Coach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {program.coaches.map((coach, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {coach.full_name?.split(' ').map(n => n[0]).join('') || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{coach.full_name}</p>
                        <div className="flex gap-2 text-sm text-slate-600">
                          {coach.email && (
                            <a href={`mailto:${coach.email}`} className="hover:text-emerald-600">
                              <Mail className="w-4 h-4 inline mr-1" />
                              Email
                            </a>
                          )}
                          {coach.phone && (
                            <a href={`tel:${coach.phone}`} className="hover:text-emerald-600">
                              <Phone className="w-4 h-4 inline mr-1" />
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Interested in Joining?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/auth/login">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth/login">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Visit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
