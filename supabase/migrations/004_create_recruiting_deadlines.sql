-- Migration: Create recruiting_deadlines table
-- Description: Tracks important recruiting deadlines (decisions, visits, applications, signing days)
-- Author: Claude AI
-- Date: 2025-12-10

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.recruiting_deadlines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete set null,
  team_id uuid references public.teams(id) on delete cascade,

  -- Deadline details
  deadline_date date not null,
  title text not null,
  description text,
  deadline_type text not null check (deadline_type in (
    'decision',
    'visit',
    'application',
    'financial_aid',
    'signing_day',
    'offer',
    'administrative',
    'recruiting',
    'other'
  )),

  -- Status tracking
  completed boolean default false,
  days_until integer,
  urgent boolean default false,

  -- Team context (for JUCO coaches)
  applies_to_all_players boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists recruiting_deadlines_player_id_idx
  on public.recruiting_deadlines(player_id);

create index if not exists recruiting_deadlines_college_id_idx
  on public.recruiting_deadlines(college_id);

create index if not exists recruiting_deadlines_team_id_idx
  on public.recruiting_deadlines(team_id);

create index if not exists recruiting_deadlines_date_idx
  on public.recruiting_deadlines(deadline_date);

create index if not exists recruiting_deadlines_type_idx
  on public.recruiting_deadlines(deadline_type);

create index if not exists recruiting_deadlines_completed_idx
  on public.recruiting_deadlines(completed)
  where completed = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.recruiting_deadlines enable row level security;

-- Players can manage their own deadlines
create policy "Players can manage their own deadlines"
  on public.recruiting_deadlines for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- Coaches can view deadlines for their team
create policy "Coaches can view team deadlines"
  on public.recruiting_deadlines for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = recruiting_deadlines.team_id
      and t.coach_id = auth.uid()
    )
  );

-- Coaches can manage team deadlines
create policy "Coaches can manage team deadlines"
  on public.recruiting_deadlines for all
  using (
    exists (
      select 1 from public.teams t
      where t.id = recruiting_deadlines.team_id
      and t.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = recruiting_deadlines.team_id
      and t.coach_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_recruiting_deadlines_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_recruiting_deadlines_updated_at_trigger
  before update on public.recruiting_deadlines
  for each row
  execute function update_recruiting_deadlines_updated_at();

-- Auto-calculate days until deadline
create or replace function calculate_deadline_days_until()
returns trigger as $$
begin
  new.days_until = (new.deadline_date - current_date);
  -- Mark as urgent if deadline is within 7 days
  if new.days_until <= 7 and new.days_until >= 0 and not new.completed then
    new.urgent = true;
  else
    new.urgent = false;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger calculate_deadline_days_until_trigger
  before insert or update on public.recruiting_deadlines
  for each row
  execute function calculate_deadline_days_until();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.recruiting_deadlines is 'Tracks important recruiting deadlines and dates';
comment on column public.recruiting_deadlines.deadline_type is 'Type: decision, visit, application, financial_aid, signing_day, offer, administrative, recruiting';
comment on column public.recruiting_deadlines.applies_to_all_players is 'If true, this deadline applies to all players on the team (for JUCO coaches)';
comment on column public.recruiting_deadlines.urgent is 'Auto-set to true if deadline is within 7 days';
