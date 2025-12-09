// ═══════════════════════════════════════════════════════════════════════════
// Camp Registration Queries
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type RegistrationStatus = 'interested' | 'registered' | 'confirmed' | 'attended' | 'cancelled';

export interface CampEvent {
  id: string;
  coach_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  capacity?: number;
  status: 'open' | 'full' | 'closed';
  price?: number;
  requirements?: string;
  created_at: string;
  updated_at: string;
  coach?: {
    id: string;
    full_name: string | null;
    program_name: string | null;
    logo_url: string | null;
    city: string | null;
    state: string | null;
  };
  registration_count?: number;
  interested_count?: number;
}

export interface CampRegistration {
  id: string;
  camp_event_id: string;
  player_id: string;
  status: RegistrationStatus;
  notes?: string;
  registered_at: string;
  updated_at: string;
  camp_event?: CampEvent;
  player?: Pick<Player, 'id' | 'full_name' | 'avatar_url' | 'primary_position' | 'grad_year'>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Player-facing queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get upcoming camps (visible to players)
 */
export async function getUpcomingCamps(limit = 20): Promise<CampEvent[]> {
  const supabase = createClient();
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('camp_events')
    .select(`
      *,
      coach:coaches(id, full_name, program_name, logo_url, city, state)
    `)
    .gte('start_date', today)
    .eq('status', 'open')
    .order('start_date', { ascending: true })
    .limit(limit);

  const campData = (data as CampEvent[] | null) ?? [];

  if (error) {
    console.error('Error fetching camps:', error);
    return [];
  }

  // Get registration counts for each camp
  const campIds = campData.map(c => c.id);
  const { data: counts } = await supabase
    .from('camp_registrations')
    .select('camp_event_id, status')
    .in('camp_event_id', campIds);

  const countMap = new Map<string, { registered: number; interested: number }>();
  counts?.forEach(r => {
    const current = countMap.get(r.camp_event_id) || { registered: 0, interested: 0 };
    if (r.status === 'interested') {
      current.interested++;
    } else if (['registered', 'confirmed'].includes(r.status)) {
      current.registered++;
    }
    countMap.set(r.camp_event_id, current);
  });

  return campData.map(camp => ({
    ...camp,
    registration_count: countMap.get(camp.id)?.registered || 0,
    interested_count: countMap.get(camp.id)?.interested || 0,
  }));
}

/**
 * Get player's camp registrations
 */
export async function getPlayerCampRegistrations(playerId: string): Promise<CampRegistration[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('camp_registrations')
    .select(`
      *,
      camp_event:camp_events(
        *,
        coach:coaches(id, full_name, program_name, logo_url, city, state)
      )
    `)
    .eq('player_id', playerId)
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error fetching player registrations:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if player is registered for a camp
 */
export async function getPlayerCampStatus(
  playerId: string, 
  campId: string
): Promise<CampRegistration | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('camp_registrations')
    .select('*')
    .eq('player_id', playerId)
    .eq('camp_event_id', campId)
    .maybeSingle();

  if (error) {
    console.error('Error checking camp status:', error);
    return null;
  }

  return data;
}

/**
 * Register interest in a camp
 */
export async function registerForCamp(
  playerId: string, 
  campId: string, 
  status: RegistrationStatus = 'interested'
): Promise<boolean> {
  const supabase = createClient();
  
  // Check if already registered
  const existing = await getPlayerCampStatus(playerId, campId);
  
  if (existing) {
    // Update existing registration
    const { error } = await supabase
      .from('camp_registrations')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating registration:', error);
      return false;
    }
    return true;
  }

  // Create new registration
  const { error } = await supabase
    .from('camp_registrations')
    .insert({
      camp_event_id: campId,
      player_id: playerId,
      status,
      registered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error creating registration:', error);
    return false;
  }

  return true;
}

/**
 * Cancel camp registration
 */
export async function cancelCampRegistration(
  playerId: string, 
  campId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('camp_registrations')
    .update({ 
      status: 'cancelled' as RegistrationStatus,
      updated_at: new Date().toISOString() 
    })
    .eq('player_id', playerId)
    .eq('camp_event_id', campId);

  if (error) {
    console.error('Error cancelling registration:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Coach-facing queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get coach's camp events
 */
export async function getCoachCamps(coachId: string): Promise<CampEvent[]> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'I',
      location: 'camp-registration.ts:getCoachCamps',
      message: 'getCoachCamps called',
      data: { coachId },
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
      hypothesisId: 'I',
      location: 'camp-registration.ts:getCoachCamps',
      message: 'Querying camp_events table',
      data: { coachId },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const { data, error } = await supabase
    .from('camp_events')
    .select(`
      *,
      coach:coaches(id, full_name, program_name, logo_url, city, state)
    `)
    .eq('coach_id', coachId)
    .order('start_date', { ascending: true });
  const campData = (data as CampEvent[] | null) ?? [];

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'I',
      location: 'camp-registration.ts:getCoachCamps',
      message: 'camp_events query completed',
      data: { dataCount: campData.length || 0, hasError: !!error, error },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c351967e-a062-4da3-8c65-86a13eaf3c2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'I',
        location: 'camp-registration.ts:getCoachCamps',
        message: 'Error condition triggered',
        data: { error, data: campData.length > 0, dataLength: campData.length },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion agent log

    console.error('Error fetching coach camps:', error);
    return [];
  }

  // Get registration counts
  const campIds = campData.map(c => c.id);
  const { data: counts } = await supabase
    .from('camp_registrations')
    .select('camp_event_id, status')
    .in('camp_event_id', campIds);

  const countMap = new Map<string, { registered: number; interested: number }>();
  counts?.forEach(r => {
    const current = countMap.get(r.camp_event_id) || { registered: 0, interested: 0 };
    if (r.status === 'interested') {
      current.interested++;
    } else if (['registered', 'confirmed'].includes(r.status)) {
      current.registered++;
    }
    countMap.set(r.camp_event_id, current);
  });

  return data.map(camp => ({
    ...camp,
    registration_count: countMap.get(camp.id)?.registered || 0,
    interested_count: countMap.get(camp.id)?.interested || 0,
  }));
}

/**
 * Get registrations for a specific camp
 */
export async function getCampRegistrations(campId: string): Promise<CampRegistration[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('camp_registrations')
    .select(`
      *,
      player:players(id, full_name, avatar_url, primary_position, grad_year)
    `)
    .eq('camp_event_id', campId)
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error fetching camp registrations:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a player's registration status (coach action)
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('camp_registrations')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', registrationId);

  if (error) {
    console.error('Error updating registration status:', error);
    return false;
  }

  return true;
}

/**
 * Create a new camp event
 */
export async function createCampEvent(
  coachId: string,
  camp: Omit<CampEvent, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'coach' | 'registration_count' | 'interested_count'>
): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('camp_events')
    .insert({
      coach_id: coachId,
      ...camp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating camp:', error);
    return null;
  }

  return data.id;
}

/**
 * Update a camp event
 */
export async function updateCampEvent(
  campId: string,
  updates: Partial<CampEvent>
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('camp_events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campId);

  if (error) {
    console.error('Error updating camp:', error);
    return false;
  }

  return true;
}
