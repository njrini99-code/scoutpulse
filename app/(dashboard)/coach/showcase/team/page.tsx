'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TeamPageShell, type TeamPageMode } from '@/components/team/team-page-shell';
import { TeamOverview } from '@/components/team/team-overview';
import { TeamRoster } from '@/components/team/team-roster';
import { TeamSchedule } from '@/components/team/team-schedule';
import { TeamMedia } from '@/components/team/team-media';
import { TeamReports } from '@/components/team/team-reports';
import {
  getTeamForOwner,
  getTeamRoster,
  getTeamSchedule,
  getTeamMedia,
  getTeamReports,
  type Team,
  type TeamMember,
  type ScheduleEvent,
  type TeamMedia as TeamMediaType,
} from '@/lib/queries/team';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

export default function ShowcaseTeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [media, setMedia] = useState<TeamMediaType[]>([]);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let coachId: string | null = null;
    let coachFullName: string | null = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
      const { data: coach } = await supabase
        .from('coaches')
        .select('full_name')
        .eq('id', coachId)
        .single();
      coachFullName = coach?.full_name || null;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: coach } = await supabase
        .from('coaches')
        .select('id, full_name, coach_type')
        .eq('user_id', user.id)
        .eq('coach_type', 'showcase')
        .single();

      if (!coach) {
        router.push('/onboarding/coach');
        return;
      }
      coachId = coach.id;
      coachFullName = coach.full_name;
    }

    setCoachName(coachFullName);

    const teamData = await getTeamForOwner(coachId!);
    if (!teamData) {
      setLoading(false);
      return;
    }

    setTeam(teamData);

    const [rosterData, scheduleData, mediaData, reportsData] = await Promise.all([
      getTeamRoster(teamData.id),
      getTeamSchedule(teamData.id),
      getTeamMedia(teamData.id),
      getTeamReports(teamData.id),
    ]);

    setMembers(rosterData);
    setEvents(scheduleData);
    setMedia(mediaData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] flex items-center justify-center">
        <div className="w-8 h-8 bg-blue-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No team found</p>
          <p className="text-sm text-slate-500">Create your team to get started</p>
        </div>
      </div>
    );
  }

  const mode: TeamPageMode = 'owner';

  // Map media to TeamMedia format
  const mediaItems = media.map(m => ({
    ...m,
    team_id: team.id,
  }));

  return (
    <TeamPageShell
      team={team}
      coachName={coachName}
      mode={mode}
      roster={members}
      schedule={events}
      media={mediaItems}
      commitments={[]}
      verifiedStats={[]}
    />
  );
}
