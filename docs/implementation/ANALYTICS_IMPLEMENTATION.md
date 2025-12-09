# Player Analytics Implementation - Complete

## Overview

Implemented comprehensive player engagement analytics system to track and display profile views, coach interactions, and recruiting activity.

## What Was Implemented

### 1. Database Schema (`supabase/migrations/008_player_engagement_events.sql`)

**New Table: `player_engagement_events`**
- Tracks individual engagement events (profile views, video views, watchlist adds, etc.)
- Captures coach_id when logged in
- Stores engagement_type, engagement_date, view_duration, and metadata
- Includes RLS policies for privacy

**Helper Functions:**
- `get_player_engagement_summary(player_id, days)` - Aggregated metrics
- `get_player_view_trend(player_id, days)` - Daily view counts for charts
- `sync_player_engagement_aggregates()` - Trigger to keep old table in sync

**Indexes for Performance:**
- `idx_engagement_events_player_date` - Player queries (most common)
- `idx_engagement_events_coach_date` - Coach queries
- `idx_engagement_events_type` - Engagement type queries

### 2. Analytics Query Library (`lib/queries/analytics.ts`)

**Functions:**
- `getPlayerEngagementSummary()` - Total views, unique coaches, watchlist adds
- `getPlayerViewTrend()` - Daily view counts for trending charts
- `getRecentEngagementEvents()` - Recent events with coach details
- `getTopViewingCoaches()` - Which coaches are viewing the most
- `getEngagementComparison()` - Current vs previous period comparison
- `trackEngagement()` - Helper to track new events

### 3. Analytics Dashboard Component (`components/player/AnalyticsDashboard.tsx`)

**Features:**
- Time range selector (7d, 30d, 90d)
- Key metrics cards with trend indicators:
  - Profile Views
  - Unique Coaches
  - Watchlist Adds
  - Video Views
- View trend chart (horizontal bar chart showing daily views)
- Top viewing coaches list with:
  - Coach avatars
  - Program names
  - View counts
  - Last viewed time (relative)

**Design:**
- Glassmorphism styling matching ScoutPulse design system
- Fully responsive (mobile + desktop)
- Loading states
- Empty states for no data
- Smooth animations

### 4. Player Dashboard Integration (`app/(dashboard)/player/page.tsx`)

**Changes:**
- Added `AnalyticsDashboard` import
- Added "Analytics" tab (first tab in the list)
- Integrated analytics component with player ID

### 5. Profile View Tracking Update (`app/profile/[id]/page.tsx`)

**Changes:**
- Updated `trackProfileView()` to use new `player_engagement_events` table
- Maintains coach_id capture for logged-in coaches
- Tracks engagement_type and engagement_date

## How to Apply Migration

### Option 1: Using the Script (Recommended)
```bash
# Set DATABASE_URL in .env.local or inline
DATABASE_URL="your_database_url" node scripts/run-migration-008.js
```

### Option 2: Manual SQL Execution
1. Connect to Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/008_player_engagement_events.sql`
4. Execute the SQL

### Option 3: Supabase CLI
```bash
supabase db push
```

## Verification

After applying migration, verify:

```sql
-- Check table exists
SELECT * FROM player_engagement_events LIMIT 1;

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%player_engagement%';

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_sync_engagement_aggregates';
```

## Testing

1. **Generate Test Data:**
   - Visit a player profile while logged in as a coach
   - Visit multiple times to generate view events
   - Add player to watchlist

2. **View Analytics:**
   - Log in as the player
   - Go to Player Dashboard
   - Click "Analytics" tab
   - Verify metrics display correctly
   - Test time range selector (7d, 30d, 90d)

3. **Check Empty States:**
   - Create a new player account
   - Verify empty states show properly

## Privacy & Security

- **RLS Policies:** Players can only see their own analytics
- **Coach Privacy:** Players see which coaches viewed, but not personal details
- **Anonymous Views:** Tracked but without coach_id (for non-logged-in views)
- **No PII Exposure:** Only displays program names and public coach info

## Performance Considerations

- **Indexes:** Optimized for player queries (most common use case)
- **Function Caching:** Database functions use efficient aggregations
- **Pagination:** Consider adding pagination if event counts grow very large
- **Cleanup:** Consider archiving old events (>1 year) periodically

## Future Enhancements

1. **Export Analytics:** Allow players to export their analytics data
2. **Email Reports:** Weekly/monthly engagement summaries
3. **Engagement Score:** Calculate overall engagement score
4. **Heatmap:** View activity by day of week / time of day
5. **Referral Tracking:** Track where profile views come from
6. **Comparative Analytics:** Compare against similar players (anonymized)

## Files Modified/Created

### Created:
- `supabase/migrations/008_player_engagement_events.sql`
- `lib/queries/analytics.ts`
- `components/player/AnalyticsDashboard.tsx`
- `scripts/run-migration-008.js`
- `ANALYTICS_IMPLEMENTATION.md` (this file)

### Modified:
- `app/profile/[id]/page.tsx` (trackProfileView function)
- `app/(dashboard)/player/page.tsx` (added Analytics tab)

## Technical Notes

### Why Two Tables?

We have both `player_engagement` (aggregated counts) and `player_engagement_events` (individual events):

- **player_engagement:** Legacy table with counts, kept for backward compatibility
- **player_engagement_events:** New table for detailed analytics
- **Trigger:** Automatically syncs aggregates when new events are inserted

This dual approach allows:
1. Fast stat card displays (pre-aggregated)
2. Detailed analytics and trends (event-level data)
3. Backward compatibility with existing dashboard code

### Engagement Types

Supported engagement types:
- `profile_view` - Someone viewed the profile
- `video_view` - Someone watched a video
- `stats_view` - Someone viewed stats section
- `watchlist_add` - Coach added player to watchlist
- `watchlist_remove` - Coach removed player from watchlist
- `message_sent` - Coach sent a message

### Data Retention

Consider implementing data retention policy:
- Keep detailed events for 1 year
- Aggregate older data into monthly summaries
- Archive events older than 2 years

## Status

✅ Database migration created
✅ Analytics queries implemented
✅ Dashboard component built
✅ Player dashboard integrated
✅ Profile tracking updated
✅ TypeScript compilation passes
⏳ Migration needs to be applied to database (network issue during implementation)
⏳ End-to-end testing pending database migration

## Next Steps

1. Apply the database migration when network is available
2. Test with real data
3. Verify all acceptance criteria
4. Mark improvement #20 as completed
