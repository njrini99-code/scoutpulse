-- Migration: Create college_interactions table
-- Description: Tracks all interactions between players and college coaches
-- Author: Claude AI
-- Date: 2025-12-10

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.college_interactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,
  interaction_date timestamptz default now(),
  interaction_type text not null check (interaction_type in (
    'email',
    'call',
    'text',
    'in_person',
    'video_call',
    'camp',
    'visit',
    'showcase',
    'meeting',
    'offer',
    'other'
  )),
  subject text,
  description text,
  contact_name text,
  contact_role text,
  notes text,
  follow_up_date date,
  importance text check (importance in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists college_interactions_player_id_idx
  on public.college_interactions(player_id);

create index if not exists college_interactions_college_id_idx
  on public.college_interactions(college_id);

create index if not exists college_interactions_coach_id_idx
  on public.college_interactions(coach_id);

create index if not exists college_interactions_date_idx
  on public.college_interactions(interaction_date desc);

create index if not exists college_interactions_type_idx
  on public.college_interactions(interaction_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.college_interactions enable row level security;

-- Players can view their own interactions
create policy "Players can view their own interactions"
  on public.college_interactions for select
  using (auth.uid() = player_id);

-- Players can insert their own interactions
create policy "Players can insert their own interactions"
  on public.college_interactions for insert
  with check (auth.uid() = player_id);

-- Players can update their own interactions
create policy "Players can update their own interactions"
  on public.college_interactions for update
  using (auth.uid() = player_id);

-- Players can delete their own interactions
create policy "Players can delete their own interactions"
  on public.college_interactions for delete
  using (auth.uid() = player_id);

-- Coaches can view interactions with their recruits
create policy "Coaches can view interactions with their recruits"
  on public.college_interactions for select
  using (auth.uid() = coach_id);

-- Coaches can insert interactions
create policy "Coaches can insert interactions"
  on public.college_interactions for insert
  with check (auth.uid() = coach_id);

-- Coaches can update their own interactions
create policy "Coaches can update their own interactions"
  on public.college_interactions for update
  using (auth.uid() = coach_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_college_interactions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_college_interactions_updated_at_trigger
  before update on public.college_interactions
  for each row
  execute function update_college_interactions_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.college_interactions is 'Tracks all interactions between players and college coaches';
comment on column public.college_interactions.interaction_type is 'Type: email, call, text, in_person, video_call, camp, visit, showcase, meeting, offer';
comment on column public.college_interactions.importance is 'Importance level: low, medium, high';
