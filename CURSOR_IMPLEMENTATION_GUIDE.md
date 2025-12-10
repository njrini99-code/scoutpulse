# ScoutPulse - Database Integration Implementation Guide

## Overview
This guide provides step-by-step instructions to replace mock data with real Supabase database integration across 4 dashboards.

**Status:** 5/8 dashboards are production-ready with 100% real data. This guide covers the remaining 3 dashboards + 1 player feature.

---

## 🎯 Priority 1: Player Journey Page (HIGH PRIORITY)

**File:** `/app/(dashboard)/player/journey/page.tsx`
**Lines:** 1072 total
**Status:** 100% Mock Data (0% Real)

### Mock Data to Replace:

#### 1. MOCK_MILESTONES (Lines 121-129)
```typescript
const MOCK_MILESTONES = [
  { id: 1, date: '2024-10-15', title: 'First College Contact', description: 'Received email from University of Miami', type: 'contact' as const },
  { id: 2, date: '2024-11-02', title: 'Unofficial Visit', description: 'Visited UCLA campus', type: 'visit' as const },
  // ... 5 more items
]
```

**Create Table:**
```sql
-- Migration: create_recruiting_milestones_table
create table public.recruiting_milestones (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  milestone_date date not null,
  title text not null,
  description text,
  milestone_type text not null check (milestone_type in ('contact', 'visit', 'camp', 'evaluation', 'offer', 'commitment', 'other')),
  college_id uuid references public.colleges(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.recruiting_milestones enable row level security;

create policy "Players can view their own milestones"
  on public.recruiting_milestones for select
  using (auth.uid() = player_id);

create policy "Players can insert their own milestones"
  on public.recruiting_milestones for insert
  with check (auth.uid() = player_id);

create policy "Players can update their own milestones"
  on public.recruiting_milestones for update
  using (auth.uid() = player_id);

create policy "Coaches can view milestones for players they recruit"
  on public.recruiting_milestones for select
  using (
    exists (
      select 1 from public.recruit_watchlist w
      where w.player_id = recruiting_milestones.player_id
      and w.coach_id = auth.uid()
    )
  );

-- Add index
create index recruiting_milestones_player_id_idx on public.recruiting_milestones(player_id);
create index recruiting_milestones_date_idx on public.recruiting_milestones(milestone_date desc);
```

**Replace Code (Lines 121-129):**
```typescript
// Remove MOCK_MILESTONES

// Add Supabase query in component
const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
  queryKey: ['player-milestones', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('recruiting_milestones')
      .select(`
        *,
        college:colleges(name, logo_url)
      `)
      .eq('player_id', session!.user.id)
      .order('milestone_date', { ascending: false })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 2. MOCK_INTERACTIONS (Lines 131-139)
```typescript
const MOCK_INTERACTIONS = [
  { id: 1, date: '2024-12-01', college: 'University of Miami', coach: 'Coach Johnson', type: 'email' as const, subject: 'Training Camp Invitation' },
  // ... 6 more items
]
```

**Create Table:**
```sql
-- Migration: create_college_interactions_table
create table public.college_interactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,
  interaction_date timestamptz default now(),
  interaction_type text not null check (interaction_type in ('email', 'call', 'text', 'in_person', 'video_call', 'other')),
  subject text,
  notes text,
  importance text check (importance in ('low', 'medium', 'high')),
  created_at timestamptz default now()
);

-- Add RLS policies
alter table public.college_interactions enable row level security;

create policy "Players can view their own interactions"
  on public.college_interactions for select
  using (auth.uid() = player_id);

create policy "Players can insert their own interactions"
  on public.college_interactions for insert
  with check (auth.uid() = player_id);

create policy "Coaches can view interactions with their recruits"
  on public.college_interactions for select
  using (auth.uid() = coach_id);

create policy "Coaches can insert interactions"
  on public.college_interactions for insert
  with check (auth.uid() = coach_id);

-- Add indexes
create index college_interactions_player_id_idx on public.college_interactions(player_id);
create index college_interactions_date_idx on public.college_interactions(interaction_date desc);
```

**Replace Code (Lines 131-139):**
```typescript
// Remove MOCK_INTERACTIONS

// Add Supabase query
const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
  queryKey: ['college-interactions', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('college_interactions')
      .select(`
        *,
        college:colleges(name, logo_url, city, state),
        coach:profiles!coach_id(full_name, avatar_url)
      `)
      .eq('player_id', session!.user.id)
      .order('interaction_date', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 3. MOCK_OFFERS (Lines 141-197)
```typescript
const MOCK_OFFERS = [
  {
    id: 1,
    college: 'University of Miami',
    offer_type: 'Full Scholarship',
    amount: 65000,
    deadline: '2025-02-01',
    pros: ['Top baseball program', 'Great weather', 'Strong academics'],
    cons: ['Far from home', 'High competition']
  },
  // ... 2 more offers
]
```

**Create Table:**
```sql
-- Migration: create_scholarship_offers_table
create table public.scholarship_offers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,
  offer_type text not null check (offer_type in ('Full Scholarship', 'Partial Scholarship', 'Walk-On', 'Preferred Walk-On', 'Other')),
  scholarship_amount numeric(10, 2),
  scholarship_percentage numeric(5, 2),
  offer_date date not null,
  decision_deadline date,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  pros jsonb default '[]'::jsonb,
  cons jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.scholarship_offers enable row level security;

create policy "Players can view their own offers"
  on public.scholarship_offers for select
  using (auth.uid() = player_id);

create policy "Players can update their own offers"
  on public.scholarship_offers for update
  using (auth.uid() = player_id);

create policy "Coaches can view offers they made"
  on public.scholarship_offers for select
  using (auth.uid() = coach_id);

create policy "Coaches can insert offers"
  on public.scholarship_offers for insert
  with check (auth.uid() = coach_id);

-- Add indexes
create index scholarship_offers_player_id_idx on public.scholarship_offers(player_id);
create index scholarship_offers_status_idx on public.scholarship_offers(status);
```

**Replace Code (Lines 141-197):**
```typescript
// Remove MOCK_OFFERS

// Add Supabase query
const { data: offers = [], isLoading: offersLoading } = useQuery({
  queryKey: ['scholarship-offers', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('scholarship_offers')
      .select(`
        *,
        college:colleges(name, logo_url, city, state, division),
        coach:profiles!coach_id(full_name, email, phone)
      `)
      .eq('player_id', session!.user.id)
      .order('offer_date', { ascending: false })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 4. MOCK_DEADLINES (Lines 199-204)
```typescript
const MOCK_DEADLINES = [
  { id: 1, date: '2025-02-01', title: 'Miami Decision Deadline', type: 'decision' as const },
  // ... 3 more deadlines
]
```

**Create Table:**
```sql
-- Migration: create_recruiting_deadlines_table
create table public.recruiting_deadlines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete set null,
  deadline_date date not null,
  title text not null,
  description text,
  deadline_type text not null check (deadline_type in ('decision', 'visit', 'application', 'financial_aid', 'signing_day', 'other')),
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.recruiting_deadlines enable row level security;

create policy "Players can manage their own deadlines"
  on public.recruiting_deadlines for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- Add indexes
create index recruiting_deadlines_player_id_idx on public.recruiting_deadlines(player_id);
create index recruiting_deadlines_date_idx on public.recruiting_deadlines(deadline_date);
```

**Replace Code (Lines 199-204):**
```typescript
// Remove MOCK_DEADLINES

// Add Supabase query
const { data: deadlines = [], isLoading: deadlinesLoading } = useQuery({
  queryKey: ['recruiting-deadlines', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('recruiting_deadlines')
      .select(`
        *,
        college:colleges(name, logo_url)
      `)
      .eq('player_id', session!.user.id)
      .eq('completed', false)
      .gte('deadline_date', new Date().toISOString().split('T')[0])
      .order('deadline_date', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

## 🎯 Priority 2: JUCO Coach Dashboard (MEDIUM PRIORITY)

**File:** `/app/(dashboard)/coach/juco/page.tsx`
**Lines:** 1119 total
**Status:** 40% Real Data, 60% Mock

### Mock Data to Replace:

#### 1. MOCK_TRANSFER_CONNECTIONS (Lines 148-157)
**Create Table:**
```sql
-- Migration: create_transfer_connections_table
create table public.transfer_connections (
  id uuid primary key default gen_random_uuid(),
  juco_coach_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  d1_coach_id uuid references public.profiles(id) on delete set null,
  players_transferred integer default 0,
  connection_strength text check (connection_strength in ('strong', 'moderate', 'developing')),
  last_transfer_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transfer_connections enable row level security;

create policy "JUCO coaches can manage their own connections"
  on public.transfer_connections for all
  using (auth.uid() = juco_coach_id)
  with check (auth.uid() = juco_coach_id);

create index transfer_connections_juco_coach_idx on public.transfer_connections(juco_coach_id);
```

**Replace Code (Lines 148-157):**
```typescript
const { data: transferConnections = [] } = useQuery({
  queryKey: ['transfer-connections', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('transfer_connections')
      .select(`
        *,
        college:colleges(name, logo_url, division),
        d1_coach:profiles!d1_coach_id(full_name)
      `)
      .eq('juco_coach_id', session!.user.id)
      .order('players_transferred', { ascending: false })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 2. MOCK_TRANSFER_PORTAL_INTEREST (Lines 159-165)
**Create Table:**
```sql
-- Migration: create_transfer_portal_interest_table
create table public.transfer_portal_interest (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  juco_coach_id uuid references public.profiles(id) on delete cascade not null,
  interested_college_id uuid references public.colleges(id) on delete cascade not null,
  interest_level text check (interest_level in ('high', 'medium', 'low')),
  contact_date date,
  notes text,
  status text default 'active' check (status in ('active', 'committed', 'declined', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transfer_portal_interest enable row level security;

create policy "JUCO coaches can view their players' portal interest"
  on public.transfer_portal_interest for all
  using (auth.uid() = juco_coach_id)
  with check (auth.uid() = juco_coach_id);

create index transfer_portal_interest_juco_coach_idx on public.transfer_portal_interest(juco_coach_id);
create index transfer_portal_interest_player_idx on public.transfer_portal_interest(player_id);
```

**Replace Code (Lines 159-165):**
```typescript
const { data: portalInterest = [] } = useQuery({
  queryKey: ['portal-interest', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('transfer_portal_interest')
      .select(`
        *,
        player:profiles!player_id(full_name, avatar_url, position),
        college:colleges!interested_college_id(name, logo_url, division)
      `)
      .eq('juco_coach_id', session!.user.id)
      .eq('status', 'active')
      .order('contact_date', { ascending: false })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 3. MOCK_PRIORITY_NEEDS (Lines 167-171)
**Create Table:**
```sql
-- Migration: create_recruiting_needs_table
create table public.recruiting_needs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade,
  position text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  quantity_needed integer default 1,
  graduation_year integer,
  min_gpa numeric(3, 2),
  notes text,
  filled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.recruiting_needs enable row level security;

create policy "Coaches can manage their own recruiting needs"
  on public.recruiting_needs for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create index recruiting_needs_coach_idx on public.recruiting_needs(coach_id);
create index recruiting_needs_position_idx on public.recruiting_needs(position);
```

**Replace Code (Lines 167-171):**
```typescript
const { data: priorityNeeds = [] } = useQuery({
  queryKey: ['priority-needs', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('recruiting_needs')
      .select('*')
      .eq('coach_id', session!.user.id)
      .eq('filled', false)
      .order('priority', { ascending: true })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 4. MOCK_ACADEMIC_PROGRESS (Lines 173-179)
**Create Table:**
```sql
-- Migration: create_academic_progress_table
create table public.academic_progress (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  semester text not null,
  academic_year text not null,
  gpa numeric(3, 2),
  cumulative_gpa numeric(3, 2),
  credits_completed integer,
  credits_needed_for_transfer integer,
  ncaa_eligibility_status text check (ncaa_eligibility_status in ('eligible', 'provisional', 'at_risk', 'ineligible')),
  notes text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.academic_progress enable row level security;

create policy "Players can view their own academic progress"
  on public.academic_progress for select
  using (auth.uid() = player_id);

create policy "Coaches can view their team's academic progress"
  on public.academic_progress for select
  using (
    exists (
      select 1 from public.team_rosters tr
      join public.teams t on tr.team_id = t.id
      where tr.player_id = academic_progress.player_id
      and t.coach_id = auth.uid()
    )
  );

create policy "Coaches can manage their team's academic progress"
  on public.academic_progress for insert
  with check (
    exists (
      select 1 from public.team_rosters tr
      join public.teams t on tr.team_id = t.id
      where tr.player_id = academic_progress.player_id
      and t.coach_id = auth.uid()
    )
  );

create index academic_progress_player_idx on public.academic_progress(player_id);
```

**Replace Code (Lines 173-179):**
```typescript
const { data: academicProgress = [] } = useQuery({
  queryKey: ['academic-progress', teamId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('academic_progress')
      .select(`
        *,
        player:profiles!player_id(full_name, avatar_url)
      `)
      .in('player_id', roster?.map(r => r.player_id) || [])
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },
  enabled: !!roster?.length,
})
```

---

#### 5. MOCK_COLLEGE_MATCHES (Lines 181-194)
**Note:** This requires a more complex matching algorithm. For now, create a simple table:

```sql
-- Migration: create_college_match_recommendations_table
create table public.college_match_recommendations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  match_score integer check (match_score between 0 and 100),
  match_factors jsonb, -- academic, athletic, location, program fit, etc.
  recommended_by text, -- 'algorithm', 'coach', 'manual'
  status text default 'pending' check (status in ('pending', 'interested', 'applied', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.college_match_recommendations enable row level security;

create policy "Players can view their own matches"
  on public.college_match_recommendations for select
  using (auth.uid() = player_id);

create policy "Coaches can view matches for their players"
  on public.college_match_recommendations for select
  using (
    exists (
      select 1 from public.team_rosters tr
      join public.teams t on tr.team_id = t.id
      where tr.player_id = college_match_recommendations.player_id
      and t.coach_id = auth.uid()
    )
  );

create index college_match_recommendations_player_idx on public.college_match_recommendations(player_id);
create index college_match_recommendations_score_idx on public.college_match_recommendations(match_score desc);
```

**Replace Code (Lines 181-194):**
```typescript
const { data: collegeMatches = [] } = useQuery({
  queryKey: ['college-matches', roster?.map(r => r.player_id)],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('college_match_recommendations')
      .select(`
        *,
        player:profiles!player_id(full_name, avatar_url, position),
        college:colleges!college_id(name, logo_url, division, city, state)
      `)
      .in('player_id', roster?.map(r => r.player_id) || [])
      .gte('match_score', 70)
      .order('match_score', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  },
  enabled: !!roster?.length,
})
```

---

#### 6. MOCK_TRANSFER_DEADLINES (Lines 196-202)
**Reuse recruiting_deadlines table but add team context:**

```sql
-- Add column to existing recruiting_deadlines table
alter table public.recruiting_deadlines
add column team_id uuid references public.teams(id) on delete cascade,
add column applies_to_all_players boolean default false;
```

**Replace Code (Lines 196-202):**
```typescript
const { data: transferDeadlines = [] } = useQuery({
  queryKey: ['transfer-deadlines', teamId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('recruiting_deadlines')
      .select('*')
      .or(`team_id.eq.${teamId},applies_to_all_players.eq.true`)
      .eq('deadline_type', 'signing_day')
      .gte('deadline_date', new Date().toISOString().split('T')[0])
      .order('deadline_date', { ascending: true })

    if (error) throw error
    return data || []
  },
  enabled: !!teamId,
})
```

---

## 🎯 Priority 3: High School Coach Dashboard (MEDIUM PRIORITY)

**File:** `/app/(dashboard)/coach/high-school/page.tsx`
**Lines:** 951 total
**Status:** 50% Real Data, 50% Mock

### Mock Data to Replace:

#### 1. MOCK_COLLEGE_INTEREST (Lines 153-157)
**Create Table:**
```sql
-- Migration: create_player_profile_views_table
create table public.player_profile_views (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default now(),
  view_duration_seconds integer,
  sections_viewed jsonb, -- ['stats', 'videos', 'measurables', etc.]
  source text, -- 'discover', 'watchlist', 'search', 'direct_link'
  created_at timestamptz default now()
);

alter table public.player_profile_views enable row level security;

create policy "Coaches can view analytics for their players"
  on public.player_profile_views for select
  using (
    exists (
      select 1 from public.team_rosters tr
      join public.teams t on tr.team_id = t.id
      where tr.player_id = player_profile_views.player_id
      and t.coach_id = auth.uid()
    )
  );

create index player_profile_views_player_idx on public.player_profile_views(player_id);
create index player_profile_views_viewer_idx on public.player_profile_views(viewer_id);
create index player_profile_views_date_idx on public.player_profile_views(viewed_at desc);
```

**Replace Code (Lines 153-157):**
```typescript
const { data: collegeInterest = [] } = useQuery({
  queryKey: ['college-interest', roster?.map(r => r.player_id)],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('player_profile_views')
      .select(`
        player_id,
        viewer:profiles!viewer_id(full_name, avatar_url, college:colleges(name, logo_url)),
        viewed_at
      `)
      .in('player_id', roster?.map(r => r.player_id) || [])
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('viewed_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Group by player
    const grouped = data?.reduce((acc, view) => {
      if (!acc[view.player_id]) {
        acc[view.player_id] = { player_id: view.player_id, views: [] }
      }
      acc[view.player_id].views.push(view)
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped || {})
  },
  enabled: !!roster?.length,
})
```

---

#### 2. MOCK_RECENT_ACTIVITY (Lines 159-163)
**Reuse player_engagement_events table that already exists:**

**Replace Code (Lines 159-163):**
```typescript
const { data: recentActivity = [] } = useQuery({
  queryKey: ['recent-activity', roster?.map(r => r.player_id)],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('player_engagement_events')
      .select(`
        *,
        player:profiles!player_id(full_name, avatar_url),
        college:colleges(name, logo_url)
      `)
      .in('player_id', roster?.map(r => r.player_id) || [])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  },
  enabled: !!roster?.length,
})
```

---

## 🎯 Priority 4: Showcase Coach Dashboard (MEDIUM PRIORITY)

**File:** `/app/(dashboard)/coach/showcase/page.tsx`
**Lines:** 775 total
**Status:** 40% Real Data, 60% Mock

### Mock Data to Replace:

#### 1. MOCK_COLLEGE_CONNECTIONS (Lines 143-149)
**Reuse transfer_connections table or create simplified version:**

```sql
-- Migration: add_showcase_connections
-- Reuse transfer_connections but make it generic
alter table public.transfer_connections rename to coach_connections;
alter table public.coach_connections rename column juco_coach_id to coach_id;

-- Update policies
drop policy "JUCO coaches can manage their own connections" on public.coach_connections;
create policy "Coaches can manage their own connections"
  on public.coach_connections for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);
```

**Replace Code (Lines 143-149):**
```typescript
const { data: collegeConnections = [] } = useQuery({
  queryKey: ['college-connections', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('coach_connections')
      .select(`
        *,
        college:colleges(name, logo_url, division, city, state),
        d1_coach:profiles!d1_coach_id(full_name, email)
      `)
      .eq('coach_id', session!.user.id)
      .order('connection_strength', { ascending: true })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 2. MOCK_UPCOMING_SHOWCASES (Lines 151-155)
**Create Table:**
```sql
-- Migration: create_showcase_events_table
create table public.showcase_events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  event_name text not null,
  event_date date not null,
  end_date date,
  location text not null,
  venue text,
  description text,
  max_participants integer,
  current_participants integer default 0,
  registration_deadline date,
  cost numeric(10, 2),
  invited_colleges jsonb default '[]'::jsonb, -- Array of college IDs
  status text default 'upcoming' check (status in ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.showcase_events enable row level security;

create policy "Organizers can manage their own events"
  on public.showcase_events for all
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "Public can view upcoming events"
  on public.showcase_events for select
  using (status = 'upcoming');

create index showcase_events_organizer_idx on public.showcase_events(organizer_id);
create index showcase_events_date_idx on public.showcase_events(event_date);

-- Create participants table
create table public.showcase_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.showcase_events(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  registration_date timestamptz default now(),
  status text default 'registered' check (status in ('registered', 'confirmed', 'cancelled', 'attended')),
  performance_notes text,
  created_at timestamptz default now(),
  unique(event_id, player_id)
);

alter table public.showcase_participants enable row level security;

create policy "Players can view their own participation"
  on public.showcase_participants for select
  using (auth.uid() = player_id);

create policy "Event organizers can manage participants"
  on public.showcase_participants for all
  using (
    exists (
      select 1 from public.showcase_events e
      where e.id = showcase_participants.event_id
      and e.organizer_id = auth.uid()
    )
  );

create index showcase_participants_event_idx on public.showcase_participants(event_id);
create index showcase_participants_player_idx on public.showcase_participants(player_id);
```

**Replace Code (Lines 151-155):**
```typescript
const { data: upcomingShowcases = [] } = useQuery({
  queryKey: ['upcoming-showcases', session?.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('showcase_events')
      .select(`
        *,
        participants:showcase_participants(count)
      `)
      .eq('organizer_id', session!.user.id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (error) throw error
    return data || []
  },
  enabled: !!session?.user?.id,
})
```

---

#### 3. MOCK_TOP_PERFORMERS (Lines 157-160)
**Create View or Query:**

```sql
-- Migration: create_player_performance_scores_table
create table public.player_performance_scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  event_id uuid references public.showcase_events(id) on delete cascade,
  evaluator_id uuid references public.profiles(id) on delete set null,
  overall_score numeric(3, 1) check (overall_score between 0 and 10),
  hitting_score numeric(3, 1),
  fielding_score numeric(3, 1),
  speed_score numeric(3, 1),
  arm_strength_score numeric(3, 1),
  game_sense_score numeric(3, 1),
  evaluation_notes text,
  evaluation_date date default current_date,
  created_at timestamptz default now()
);

alter table public.player_performance_scores enable row level security;

create policy "Players can view their own scores"
  on public.player_performance_scores for select
  using (auth.uid() = player_id);

create policy "Evaluators can manage scores"
  on public.player_performance_scores for all
  using (auth.uid() = evaluator_id)
  with check (auth.uid() = evaluator_id);

create index player_performance_scores_player_idx on public.player_performance_scores(player_id);
create index player_performance_scores_event_idx on public.player_performance_scores(event_id);
create index player_performance_scores_overall_idx on public.player_performance_scores(overall_score desc);
```

**Replace Code (Lines 157-160):**
```typescript
const { data: topPerformers = [] } = useQuery({
  queryKey: ['top-performers', roster?.map(r => r.player_id)],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('player_performance_scores')
      .select(`
        player_id,
        player:profiles!player_id(full_name, avatar_url, position, graduation_year),
        overall_score,
        evaluation_date
      `)
      .in('player_id', roster?.map(r => r.player_id) || [])
      .gte('evaluation_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 90 days
      .order('overall_score', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  },
  enabled: !!roster?.length,
})
```

---

## 🎯 Priority 5: College Discover Notes Feature (LOW PRIORITY)

**File:** `/app/(dashboard)/coach/college/discover/page.tsx`
**Line:** 323
**Status:** TODO comment

**Add to existing scout_cards table or create notes field:**

```sql
-- Migration: add_notes_to_recruit_watchlist
alter table public.recruit_watchlist
add column notes text,
add column notes_updated_at timestamptz;

-- Create trigger to auto-update notes timestamp
create or replace function update_notes_timestamp()
returns trigger as $$
begin
  if NEW.notes is distinct from OLD.notes then
    NEW.notes_updated_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger update_recruit_watchlist_notes_timestamp
before update on public.recruit_watchlist
for each row execute function update_notes_timestamp();
```

**Implementation (Line 323):**
```typescript
// Replace TODO comment with actual implementation
const handleAddNote = async (playerId: string, note: string) => {
  try {
    const { error } = await supabase
      .from('recruit_watchlist')
      .upsert({
        coach_id: session!.user.id,
        player_id: playerId,
        notes: note,
        added_date: new Date().toISOString(),
      }, {
        onConflict: 'coach_id,player_id',
      })

    if (error) throw error

    toast.success('Note added successfully')
    // Refresh watchlist
    queryClient.invalidateQueries(['recruit-watchlist'])
  } catch (error) {
    console.error('Error adding note:', error)
    toast.error('Failed to add note')
  }
}
```

---

## 📝 Implementation Checklist

### Phase 1: Database Setup (Do First)
- [ ] Run all SQL migrations in Supabase SQL Editor
- [ ] Verify RLS policies are working
- [ ] Add test data to new tables
- [ ] Verify indexes are created

### Phase 2: Player Journey (HIGH PRIORITY)
- [ ] Replace MOCK_MILESTONES with real query
- [ ] Replace MOCK_INTERACTIONS with real query
- [ ] Replace MOCK_OFFERS with real query
- [ ] Replace MOCK_DEADLINES with real query
- [ ] Test all features work with real data
- [ ] Add loading states for all queries
- [ ] Add error handling

### Phase 3: JUCO Coach (MEDIUM PRIORITY)
- [ ] Replace all 6 mock data sections
- [ ] Test transfer connections
- [ ] Test portal interest tracking
- [ ] Test academic progress
- [ ] Verify RLS allows coach to see only their players

### Phase 4: HS & Showcase Coaches (MEDIUM PRIORITY)
- [ ] Implement college interest tracking
- [ ] Implement recent activity feed
- [ ] Create showcase events system
- [ ] Implement top performers ranking

### Phase 5: Polish (LOW PRIORITY)
- [ ] Add notes feature to discover page
- [ ] Create college matching algorithm (AI/ML)
- [ ] Add data export features
- [ ] Performance optimization

---

## 🧪 Testing Instructions

After each implementation:

1. **Test Authentication**: Ensure only correct users can see data
2. **Test CRUD Operations**: Create, read, update, delete all work
3. **Test Edge Cases**: Empty states, loading states, error states
4. **Test RLS Policies**: Try accessing data as different user types
5. **Test Performance**: Queries should be fast (<500ms)

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **RLS Policy Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## ⚠️ Important Notes

1. **Always back up database before running migrations**
2. **Test RLS policies thoroughly** - security is critical
3. **Use transactions for multi-table operations**
4. **Add proper error handling to all queries**
5. **Implement optimistic updates where appropriate**
6. **Consider adding database triggers for automated tasks**
7. **Monitor query performance with Supabase Dashboard**

---

## 🎯 Success Criteria

When complete, all 8 dashboards should:
- ✅ Use 100% real data from Supabase
- ✅ Have proper loading states
- ✅ Have error handling
- ✅ Respect RLS policies
- ✅ Be performant (<500ms queries)
- ✅ Have no TODO comments
- ✅ Have no mock data constants

---

**Estimated Time to Complete:**
- Phase 1 (Database): 2-3 hours
- Phase 2 (Player Journey): 3-4 hours
- Phase 3 (JUCO Coach): 4-5 hours
- Phase 4 (HS/Showcase): 3-4 hours
- Phase 5 (Polish): 2-3 hours

**Total: 14-19 hours of development work**

---

Good luck! 🚀
