-- Migration: Create scholarship_offers table
-- Description: Stores scholarship offers from colleges to players with pros/cons analysis
-- Author: Claude AI
-- Date: 2025-12-10

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.scholarship_offers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null,

  -- Offer details
  offer_type text not null check (offer_type in (
    'Full Scholarship',
    'Partial Scholarship',
    'Walk-On',
    'Preferred Walk-On',
    'Other'
  )),
  scholarship_amount numeric(10, 2),
  scholarship_percentage numeric(5, 2),

  -- Dates and status
  offer_date date not null,
  decision_deadline date,
  days_until_deadline integer,
  status text not null default 'pending' check (status in (
    'pending',
    'considering',
    'accepted',
    'declined',
    'expired'
  )),

  -- Additional details
  location text,
  conference text,
  division text,
  coach_name text,
  coach_email text,
  coach_phone text,

  -- Analysis
  pros jsonb default '[]'::jsonb,
  cons jsonb default '[]'::jsonb,
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists scholarship_offers_player_id_idx
  on public.scholarship_offers(player_id);

create index if not exists scholarship_offers_college_id_idx
  on public.scholarship_offers(college_id);

create index if not exists scholarship_offers_status_idx
  on public.scholarship_offers(status);

create index if not exists scholarship_offers_offer_date_idx
  on public.scholarship_offers(offer_date desc);

create index if not exists scholarship_offers_deadline_idx
  on public.scholarship_offers(decision_deadline);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.scholarship_offers enable row level security;

-- Players can view their own offers
create policy "Players can view their own offers"
  on public.scholarship_offers for select
  using (auth.uid() = player_id);

-- Players can update their own offers
create policy "Players can update their own offers"
  on public.scholarship_offers for update
  using (auth.uid() = player_id);

-- Players can delete their own offers
create policy "Players can delete their own offers"
  on public.scholarship_offers for delete
  using (auth.uid() = player_id);

-- Coaches can view offers they made
create policy "Coaches can view offers they made"
  on public.scholarship_offers for select
  using (auth.uid() = coach_id);

-- Coaches can insert offers
create policy "Coaches can insert offers"
  on public.scholarship_offers for insert
  with check (auth.uid() = coach_id);

-- Coaches can update their own offers
create policy "Coaches can update their own offers"
  on public.scholarship_offers for update
  using (auth.uid() = coach_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_scholarship_offers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_scholarship_offers_updated_at_trigger
  before update on public.scholarship_offers
  for each row
  execute function update_scholarship_offers_updated_at();

-- Auto-calculate days until deadline
create or replace function calculate_days_until_deadline()
returns trigger as $$
begin
  if new.decision_deadline is not null then
    new.days_until_deadline = (new.decision_deadline - current_date);
  else
    new.days_until_deadline = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger calculate_days_until_deadline_trigger
  before insert or update on public.scholarship_offers
  for each row
  execute function calculate_days_until_deadline();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.scholarship_offers is 'Stores scholarship offers from colleges to players';
comment on column public.scholarship_offers.offer_type is 'Type: Full Scholarship, Partial Scholarship, Walk-On, Preferred Walk-On';
comment on column public.scholarship_offers.status is 'Status: pending, considering, accepted, declined, expired';
comment on column public.scholarship_offers.pros is 'JSON array of pros for this offer';
comment on column public.scholarship_offers.cons is 'JSON array of cons for this offer';
