-- Email Sequence Table
-- Tracks email sequences sent to users (Welcome, Week 1 Tips, Success Stories)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'week1_tips', 'success_stories')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  email_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sequence_user_id ON email_sequence(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_scheduled ON email_sequence(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_sequence_type ON email_sequence(email_type);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_email_sequence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_sequence_updated_at
  BEFORE UPDATE ON email_sequence
  FOR EACH ROW
  EXECUTE FUNCTION update_email_sequence_updated_at();

-- RLS Policies
ALTER TABLE email_sequence ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email sequence records
CREATE POLICY "Users can view their own email sequence"
  ON email_sequence
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all records
CREATE POLICY "Service role can manage email sequence"
  ON email_sequence
  FOR ALL
  USING (auth.role() = 'service_role');
