import { createClient } from '@/lib/supabase/client';

export interface MinimalPlayer {
  id: string;
  full_name: string;
  grad_year: number | null;
  primary_position: string | null;
  state: string | null;
  avatar_url: string | null;
  metrics?: any[];
}

export type RecruitStatus = 'watchlist' | 'high_priority' | 'offer_extended' | 'committed' | 'uninterested';

export interface RecruitPipelineEntry {
  id: string;
  player: MinimalPlayer & { primary_position: string | null; grad_year: number | null; state: string | null };
  status: RecruitStatus;
  position_role: string | null;
}

// TODO: Add Supabase migration for recruit_watchlist table and policies.

export async function getRecruitingPipelineForCoach(coachId: string): Promise<RecruitPipelineEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recruit_watchlist')
    .select(`
      id,
      status,
      position_role,
      players (
        id,
        full_name,
        grad_year,
        primary_position,
        high_school_state,
        avatar_url
      )
    `)
    .eq('coach_id', coachId);

  if (error || !data) {
    console.error('getRecruitingPipelineForCoach failed', error);
    return [];
  }

  return data
    .filter((row: any) => row.players)
    .map((row: any) => ({
      id: row.id,
      status: row.status as RecruitStatus,
      position_role: row.position_role,
      player: {
        id: row.players.id,
        full_name: row.players.full_name || 'Player',
        grad_year: row.players.grad_year,
        primary_position: row.players.primary_position,
        state: row.players.high_school_state,
        avatar_url: row.players.avatar_url,
        metrics: [],
      },
    }));
}

export async function updateRecruitStatus(entryId: string, newStatus: RecruitStatus) {
  const supabase = createClient();
  const { error } = await supabase
    .from('recruit_watchlist')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', entryId);

  if (error) {
    console.error('updateRecruitStatus failed', error);
    throw error;
  }
}

export async function addPlayerToWatchlist(
  coachId: string,
  playerId: string,
  status: RecruitStatus = 'watchlist'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('recruit_watchlist')
    .insert({
      coach_id: coachId,
      player_id: playerId,
      status,
    });

  if (error) {
    console.error('addPlayerToWatchlist failed', error);
    throw error;
  }
  return true;
}

export async function addNoteToRecruit(
  coachId: string,
  playerId: string,
  note: string
): Promise<boolean> {
  const supabase = createClient();

  // First, check if the player is already on the watchlist
  const { data: existing } = await supabase
    .from('recruit_watchlist')
    .select('id, notes')
    .eq('coach_id', coachId)
    .eq('player_id', playerId)
    .single();

  if (existing) {
    // Append note to existing notes
    const timestamp = new Date().toISOString();
    const existingNotes = existing.notes || '';
    const newNotes = existingNotes
      ? `${existingNotes}\n\n---\n${timestamp}\n${note}`
      : `${timestamp}\n${note}`;

    const { error } = await supabase
      .from('recruit_watchlist')
      .update({ notes: newNotes, updated_at: timestamp })
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update note:', error);
      return false;
    }
  } else {
    // Add player to watchlist with note
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('recruit_watchlist')
      .insert({
        coach_id: coachId,
        player_id: playerId,
        status: 'watchlist',
        notes: `${timestamp}\n${note}`,
      });

    if (error) {
      console.error('Failed to add player with note:', error);
      return false;
    }
  }

  return true;
}
