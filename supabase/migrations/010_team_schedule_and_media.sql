-- ScoutPulse Team Schedule and Media Migration
-- Adds: team_schedule, team_media tables
-- Safe to run multiple times (IF NOT EXISTS)

-- ============================================================================
-- TEAM_SCHEDULE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('game', 'practice', 'tournament', 'showcase')),
  opponent_name text,
  event_name text,
  location_name text,
  location_address text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  notes text,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- TEAM_MEDIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  title text,
  description text,
  url text NOT NULL,
  storage_path text, -- Path in Supabase Storage for deletion
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- COACHING_STAFF TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS coaching_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL, -- 'Head Coach', 'Assistant Coach', 'Pitching Coach', etc.
  email text,
  phone text,
  bio text,
  avatar_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE team_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_staff ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Team Schedule
-- ============================================================================

-- Anyone can view public team schedules
DROP POLICY IF EXISTS "View public team schedules" ON team_schedule;
CREATE POLICY "View public team schedules" ON team_schedule
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Team owners can view all their team schedules
DROP POLICY IF EXISTS "Team owners view schedules" ON team_schedule;
CREATE POLICY "Team owners view schedules" ON team_schedule
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  ));

-- Team members (players) can view their team schedules
DROP POLICY IF EXISTS "Team members view schedules" ON team_schedule;
CREATE POLICY "Team members view schedules" ON team_schedule
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT team_id FROM team_memberships
    WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  ));

-- Team owners can manage schedules
DROP POLICY IF EXISTS "Team owners manage schedules" ON team_schedule;
CREATE POLICY "Team owners manage schedules" ON team_schedule
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (team_id IN (
    SELECT id FROM teams WHERE coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  ));

-- ============================================================================
-- RLS POLICIES - Team Media
-- ============================================================================

-- Anyone can view team media
DROP POLICY IF EXISTS "Anyone can view team media" ON team_media;
CREATE POLICY "Anyone can view team media" ON team_media
  FOR SELECT TO authenticated USING (true);

-- Team owners can manage media
DROP POLICY IF EXISTS "Team owners manage media" ON team_media;
CREATE POLICY "Team owners manage media" ON team_media
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT id FROM teams WHERE coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (team_id IN (
    SELECT id FROM teams WHERE coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  ));

-- ============================================================================
-- RLS POLICIES - Coaching Staff
-- ============================================================================

-- Anyone can view active coaching staff
DROP POLICY IF EXISTS "View active coaching staff" ON coaching_staff;
CREATE POLICY "View active coaching staff" ON coaching_staff
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Coaches can view all their staff (including inactive)
DROP POLICY IF EXISTS "Coaches view own staff" ON coaching_staff;
CREATE POLICY "Coaches view own staff" ON coaching_staff
  FOR SELECT TO authenticated
  USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- Coaches can manage their staff
DROP POLICY IF EXISTS "Coaches manage staff" ON coaching_staff;
CREATE POLICY "Coaches manage staff" ON coaching_staff
  FOR ALL TO authenticated
  USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Team Schedule indexes
CREATE INDEX IF NOT EXISTS idx_team_schedule_team ON team_schedule(team_id);
CREATE INDEX IF NOT EXISTS idx_team_schedule_start ON team_schedule(start_time);
CREATE INDEX IF NOT EXISTS idx_team_schedule_type ON team_schedule(event_type);
CREATE INDEX IF NOT EXISTS idx_team_schedule_public ON team_schedule(is_public) WHERE is_public = true;

-- Team Media indexes
CREATE INDEX IF NOT EXISTS idx_team_media_team ON team_media(team_id);
CREATE INDEX IF NOT EXISTS idx_team_media_type ON team_media(media_type);
CREATE INDEX IF NOT EXISTS idx_team_media_created ON team_media(created_at DESC);

-- Coaching Staff indexes
CREATE INDEX IF NOT EXISTS idx_coaching_staff_coach ON coaching_staff(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_staff_active ON coaching_staff(is_active) WHERE is_active = true;

-- ============================================================================
-- TRIGGERS - Updated At
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_team_schedule ON team_schedule;
CREATE TRIGGER set_updated_at_team_schedule
  BEFORE UPDATE ON team_schedule
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_coaching_staff ON coaching_staff;
CREATE TRIGGER set_updated_at_coaching_staff
  BEFORE UPDATE ON coaching_staff
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Migration 010 complete! Tables created: team_schedule, team_media, coaching_staff' as status;
