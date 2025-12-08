'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TeamPageShell, type TeamPageMode } from '@/components/team/team-page-shell';
import { TeamOverview } from '@/components/team/team-overview';
import { TeamRoster } from '@/components/team/team-roster';
import { TeamSchedule } from '@/components/team/team-schedule';
import { TeamMedia } from '@/components/team/team-media';
import { TeamReports } from '@/components/team/team-reports';
import {
  getTeamById,
  getTeamRoster,
  getTeamSchedule,
  getTeamMedia,
  getTeamReports,
  type Team,
  type TeamMember,
  type ScheduleEvent,
  type TeamMedia as TeamMediaType,
} from '@/lib/queries/team';

export default function CollegeTeamViewPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [media, setMedia] = useState<TeamMediaType[]>([]);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Verify user is a college coach
    const { data: coach } = await supabase
      .from('coaches')
      .select('id, coach_type')
      .eq('user_id', user.id)
      .eq('coach_type', 'college')
      .single();

    if (!coach) {
      router.push('/coach');
      return;
    }

    const teamData = await getTeamById(teamId);
    if (!teamData) {
      setLoading(false);
      return;
    }

    setTeam(teamData);

    // Get coach name
    const { data: teamCoach } = await supabase
      .from('coaches')
      .select('full_name')
      .eq('id', teamData.coach_id)
      .single();

    setCoachName(teamCoach?.full_name || null);

    const [rosterData, scheduleData, mediaData, reportsData] = await Promise.all([
      getTeamRoster(teamId),
      getTeamSchedule(teamId),
      getTeamMedia(teamId),
      getTeamReports(teamId),
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
          <p className="text-slate-400 mb-4">Team not found</p>
          <button
            onClick={() => router.push('/coach/college/discover')}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  const mode: TeamPageMode = 'viewer';

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
