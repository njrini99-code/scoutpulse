-- Migration: Create recruiting_milestones table
-- Description: Stores player recruiting journey milestones (first contact, visits, camps, offers, etc.)
-- Author: Claude AI
-- Date: 2025-12-10

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.recruiting_milestones (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  milestone_date date not null,
  title text not null,
  description text,
  milestone_type text not null check (milestone_type in (
    'contact',
    'visit',
    'camp',
    'evaluation',
    'offer',
    'commitment',
    'administrative',
    'academic',
    'athletic',
    'recruiting',
    'other'
  )),
  college_id uuid references public.colleges(id) on delete set null,
  completed_date date,
  status text default 'upcoming' check (status in ('completed', 'in_progress', 'upcoming', 'overdue')),
  category text check (category in ('administrative', 'academic', 'athletic', 'recruiting', 'other')),
  priority text check (priority in ('high', 'medium', 'low')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists recruiting_milestones_player_id_idx
  on public.recruiting_milestones(player_id);

create index if not exists recruiting_milestones_date_idx
  on public.recruiting_milestones(milestone_date desc);

create index if not exists recruiting_milestones_status_idx
  on public.recruiting_milestones(status);

create index if not exists recruiting_milestones_college_idx
  on public.recruiting_milestones(college_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.recruiting_milestones enable row level security;

-- Players can view their own milestones
create policy "Players can view their own milestones"
  on public.recruiting_milestones for select
  using (auth.uid() = player_id);

-- Players can insert their own milestones
create policy "Players can insert their own milestones"
  on public.recruiting_milestones for insert
  with check (auth.uid() = player_id);

-- Players can update their own milestones
create policy "Players can update their own milestones"
  on public.recruiting_milestones for update
  using (auth.uid() = player_id);

-- Players can delete their own milestones
create policy "Players can delete their own milestones"
  on public.recruiting_milestones for delete
  using (auth.uid() = player_id);

-- Coaches can view milestones for players they recruit
create policy "Coaches can view milestones for players they recruit"
  on public.recruiting_milestones for select
  using (
    exists (
      select 1 from public.recruit_watchlist w
      where w.player_id = recruiting_milestones.player_id
      and w.coach_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_recruiting_milestones_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_recruiting_milestones_updated_at_trigger
  before update on public.recruiting_milestones
  for each row
  execute function update_recruiting_milestones_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.recruiting_milestones is 'Stores recruiting journey milestones for players';
comment on column public.recruiting_milestones.milestone_type is 'Type of milestone: contact, visit, camp, evaluation, offer, commitment, etc.';
comment on column public.recruiting_milestones.status is 'Current status: completed, in_progress, upcoming, overdue';
comment on column public.recruiting_milestones.priority is 'Priority level: high, medium, low';
