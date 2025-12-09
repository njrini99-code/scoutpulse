/**
 * Team Data Access Helpers
 * 
 * Handles all team-related queries for:
 * - Team owners (HS/Showcase/JUCO coaches)
 * - College coach viewers
 * - Players
 */

import { createClient } from '@/lib/supabase/client';

export interface Team {
  id: string;
  name: string;
  team_type: 'high_school' | 'showcase' | 'juco';
  organization_name: string | null;
  school_name: string | null;
  city: string | null;
  state: string | null;
  coach_id: string;
  logo_url: string | null;
  banner_url: string | null;
  about: string | null;
  program_values: string | null;
  placement_highlights: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  status: 'pending' | 'active' | 'former';
  primary_team: boolean;
  jersey_number: string | null;
  graduation_year: number | null;
  role_notes: string | null;
  created_at: string;
  updated_at: string;
  player: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    grad_year: number | null;
    primary_position: string | null;
    secondary_position: string | null;
    high_school_state: string | null;
    avatar_url: string | null;
  };
}

export interface ScheduleEvent {
  id: string;
  team_id: string;
  event_type: 'game' | 'practice' | 'tournament' | 'showcase';
  opponent_name: string | null;
  event_name: string | null;
  location_name: string | null;
  location_address: string | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMedia {
  id: string;
  team_id: string;
  media_type: 'photo' | 'video';
  title: string | null;
  description: string | null;
  url: string;
  created_at: string;
}

export interface VerifiedStat {
  id: string;
  team_id: string;
  player_id: string;
  stat_type: string;
  value: number | string;
  source: string | null;
  event_name: string | null;
  measured_at: string | null;
  created_at: string;
}

export interface TeamCommitment {
  player_id: string;
  player_name: string;
  grad_year: number | null;
  college_name: string | null;
  division: string | null;
  commitment_year: number | null;
}

/**
 * Get team by ID (for viewers)
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error || !data) {
    console.error('Error fetching team:', error);
    return null;
  }

  return data as Team;
}

/**
 * Get team for owner (coach managing their team)
 */
export async function getTeamForOwner(coachId: string): Promise<Team | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('coach_id', coachId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching team for owner:', error);
    return null;
  }

  return data as Team;
}

/**
 * Get team roster
 */
export async function getTeamRoster(teamId: string): Promise<TeamMember[]> {
  const supabase = createClient();
  
  // TODO: Use team_schedule table when migration is added
  // For now, use team_memberships with players join
  const { data, error } = await supabase
    .from('team_memberships')
    .select(`
      id,
      team_id,
      player_id,
      role,
      joined_at,
      players:player_id (
        id,
        first_name,
        last_name,
        full_name,
        grad_year,
        primary_position,
        secondary_position,
        high_school_state,
        avatar_url
      )
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching team roster:', error);
    return [];
  }

  // Map to TeamMember format
  return data.map((membership: any) => ({
    id: membership.id,
    team_id: membership.team_id,
    player_id: membership.player_id,
    status: 'active' as const, // TODO: Add status column to team_memberships
    primary_team: true, // TODO: Add primary_team column
    jersey_number: null, // TODO: Add jersey_number column
    graduation_year: membership.players?.grad_year || null,
    role_notes: membership.role || null,
    created_at: membership.joined_at,
    updated_at: membership.joined_at,
    player: {
      id: membership.players?.id || membership.player_id,
      full_name: membership.players?.full_name || 
        `${membership.players?.first_name || ''} ${membership.players?.last_name || ''}`.trim(),
      first_name: membership.players?.first_name || null,
      last_name: membership.players?.last_name || null,
      grad_year: membership.players?.grad_year || null,
      primary_position: membership.players?.primary_position || null,
      secondary_position: membership.players?.secondary_position || null,
      high_school_state: membership.players?.high_school_state || null,
      avatar_url: membership.players?.avatar_url || null,
    },
  }));
}

/**
 * Get team schedule
 */
export async function getTeamSchedule(teamId: string): Promise<ScheduleEvent[]> {
  const supabase = createClient();
  
  // TODO: Use team_schedule table when migration is added
  // For now, return empty array or use camp_events if team has coach_id
  const { data: team } = await supabase
    .from('teams')
    .select('coach_id')
    .eq('id', teamId)
    .single();

  if (!team) return [];

  // Use camp_events as placeholder (will be replaced with team_schedule)
  const { data: events, error } = await supabase
    .from('camp_events')
    .select('*')
    .eq('coach_id', team.coach_id)
    .order('event_date', { ascending: true });

  if (error || !events) {
    return [];
  }

  // Map to ScheduleEvent format
  return events.map((event: any) => ({
    id: event.id,
    team_id: teamId,
    event_type: event.event_type === 'Prospect Camp' ? 'showcase' : 'game' as any,
    opponent_name: null,
    event_name: event.name,
    location_name: event.location,
    location_address: null,
    start_time: event.event_date ? `${event.event_date}T${event.start_time || '00:00:00'}` : new Date().toISOString(),
    end_time: event.end_time ? `${event.event_date}T${event.end_time}` : null,
    notes: event.description,
    is_public: event.is_public,
    created_at: event.created_at,
    updated_at: event.updated_at,
  }));
}

/**
 * Get team media
 */
export async function getTeamMedia(teamId: string): Promise<TeamMedia[]> {
  const supabase = createClient();
  
  // TODO: Use team_media table when migration is added
  // For now, return empty array
  return [];
}

/**
 * Get team reports (commitments and verified stats)
 */
export async function getTeamReports(teamId: string): Promise<{
  commitments: TeamCommitment[];
  verifiedStats: VerifiedStat[];
}> {
  const supabase = createClient();
  
  // TODO: Implement when team_commitments and verified_player_stats tables are added
  // For now, return empty arrays
  return {
    commitments: [],
    verifiedStats: [],
  };
}

/**
 * Update team info (owner only)
 */
export async function updateTeamInfo(
  teamId: string,
  updates: Partial<Team>
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('teams')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId);

  return !error;
}

/**
 * Add schedule event (owner only)
 */
export async function addScheduleEvent(
  teamId: string,
  event: Omit<ScheduleEvent, 'id' | 'team_id' | 'created_at' | 'updated_at'>
): Promise<string | null> {
  const supabase = createClient();
  
  // TODO: Use team_schedule table when migration is added
  // For now, use camp_events as placeholder
  const { data: team } = await supabase
    .from('teams')
    .select('coach_id')
    .eq('id', teamId)
    .single();

  if (!team) return null;

  const { data, error } = await supabase
    .from('camp_events')
    .insert({
      coach_id: team.coach_id,
      name: event.event_name || event.opponent_name || 'Event',
      event_date: event.start_time.split('T')[0],
      start_time: event.start_time.split('T')[1]?.split('.')[0] || null,
      end_time: event.end_time?.split('T')[1]?.split('.')[0] || null,
      event_type: event.event_type === 'game' ? 'Game' : 
                  event.event_type === 'practice' ? 'Practice' :
                  event.event_type === 'tournament' ? 'Tournament' : 'Prospect Camp',
      description: event.notes,
      location: event.location_name || event.location_address || null,
      is_public: event.is_public,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error adding schedule event:', error);
    return null;
  }

  return data.id;
}

/**
 * Delete schedule event (owner only)
 */
export async function deleteScheduleEvent(eventId: string): Promise<boolean> {
  const supabase = createClient();
  
  // TODO: Use team_schedule table when migration is added
  // For now, delete from camp_events
  const { error } = await supabase
    .from('camp_events')
    .delete()
    .eq('id', eventId);

  return !error;
}

/**
 * Add team media (owner only)
 */
export async function addTeamMedia(
  teamId: string,
  media: Omit<TeamMedia, 'id' | 'team_id' | 'created_at'>
): Promise<string | null> {
  const supabase = createClient();
  
  // TODO: Use team_media table when migration is added
  // For now, return null
  return null;
}

/**
 * Remove player from team (owner only)
 */
export async function removePlayerFromTeam(
  membershipId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('team_memberships')
    .delete()
    .eq('id', membershipId);

  return !error;
}

/**
 * Get player's team (for player view)
 */
export async function getPlayerTeam(playerId: string, teamType?: 'high_school' | 'showcase'): Promise<Team | null> {
  const supabase = createClient();

  // If teamType is specified, find the team membership for that type
  if (teamType) {
    const { data: membership } = await supabase
      .from('team_memberships')
      .select('team_id')
      .eq('player_id', playerId)
      .eq('teams.team_type', teamType)
      .maybeSingle();

    if (!membership) return null;

    return getTeamById(membership.team_id);
  }

  // Original behavior - get the first team
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('team_id')
    .eq('player_id', playerId)
    .maybeSingle();

  if (!membership) return null;

  return getTeamById(membership.team_id);
}

// ============================================================================
// State-Based Queries for Discover Page
// ============================================================================

export interface TeamByStateSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  type: 'high_school' | 'showcase';
  playersCount: number;
  committedCount: number;
}

export interface JucoByStateSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  conference: string | null;
  playersCount: number;
}

/**
 * Get teams by state (high school and showcase)
 */
export async function getTeamsByState(
  stateCode: string,
  teamTypes: ('high_school' | 'showcase')[] = ['high_school', 'showcase']
): Promise<TeamByStateSummary[]> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'G',
      location: 'team.ts:getTeamsByState',
      message: 'getTeamsByState called',
      data: { stateCode, teamTypes },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const supabase = createClient();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'G',
      location: 'team.ts:getTeamsByState',
      message: 'About to query Supabase',
      data: { stateCode, teamTypes },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      logo_url,
      city,
      state,
      team_type
    `)
    .eq('state', stateCode)
    .in('team_type', teamTypes);
  const teamData = (teams as { id: string; name?: string; logo_url?: string; city?: string; state?: string; team_type?: string }[] | null) ?? [];

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'G',
      location: 'team.ts:getTeamsByState',
      message: 'Query completed',
      data: { teamsCount: teamData.length || 0, hasError: !!error, error },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  if (error || teamData.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'G',
        location: 'team.ts:getTeamsByState',
        message: 'Error condition triggered',
        data: { error, teams: teamData.length > 0, teamsLength: teamData.length },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion agent log

    console.error('Error fetching teams by state:', error);
    return [];
  }

  // Get player counts and commitment counts for each team
  const teamIds = teamData.map(t => t.id);
  
  const { data: memberships } = await supabase
    .from('team_memberships')
    .select('team_id, player_id')
    .in('team_id', teamIds);

  // Count players per team
  const playerCounts: Record<string, number> = {};
  memberships?.forEach(m => {
    playerCounts[m.team_id] = (playerCounts[m.team_id] || 0) + 1;
  });

  // Get commitment counts (players with college commitments)
  // For now, we'll estimate based on team type - showcase teams typically have higher commit rates
  // TODO: Implement actual commitment tracking

  return teams.map(team => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logo_url,
    city: team.city,
    state: team.state,
    type: team.team_type as 'high_school' | 'showcase',
    playersCount: playerCounts[team.id] || 0,
    committedCount: Math.floor((playerCounts[team.id] || 0) * (team.team_type === 'showcase' ? 0.4 : 0.2)),
  }));
}

/**
 * Get JUCO programs by state
 */
export async function getJucosByState(stateCode: string): Promise<JucoByStateSummary[]> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H',
      location: 'team.ts:getJucosByState',
      message: 'getJucosByState called',
      data: { stateCode },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const supabase = createClient();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H',
      location: 'team.ts:getJucosByState',
      message: 'About to query Supabase for JUCOs',
      data: { stateCode },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      logo_url,
      city,
      state,
      organization_name
    `)
    .eq('state', stateCode)
    .eq('team_type', 'juco');
  const teamData = (teams as { id: string; name?: string; logo_url?: string; city?: string; state?: string; organization_name?: string }[] | null) ?? [];

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H',
      location: 'team.ts:getJucosByState',
      message: 'JUCO query completed',
      data: { teamsCount: teamData.length || 0, hasError: !!error, error },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  if (error || teamData.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H',
        location: 'team.ts:getJucosByState',
        message: 'JUCO error condition triggered',
        data: { error, teams: teamData.length > 0, teamsLength: teamData.length },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion agent log

    console.error('Error fetching JUCOs by state:', error);
    return [];
  }

  // Get player counts for each JUCO
  const teamIds = teamData.map(t => t.id);
  
  const { data: memberships } = await supabase
    .from('team_memberships')
    .select('team_id')
    .in('team_id', teamIds);

  const playerCounts: Record<string, number> = {};
  memberships?.forEach(m => {
    playerCounts[m.team_id] = (playerCounts[m.team_id] || 0) + 1;
  });

  return teamData.map(team => ({
    id: team.id,
    name: team.name || '',
    logoUrl: team.logo_url || null,
    city: team.city || '',
    state: team.state || '',
    conference: team.organization_name || '', // Using organization_name as conference placeholder
    playersCount: playerCounts[team.id] || 0,
  }));
}
