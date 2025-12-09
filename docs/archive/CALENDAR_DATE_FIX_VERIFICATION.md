# Calendar Event Date Handling Fix - Verification Guide

## Problem Description

The calendar event modal had potential timezone-related bugs when handling dates. When creating or editing events, the date could shift by one day depending on the user's timezone.

### Root Cause

The issue occurred when converting dates to strings for database queries:

```typescript
// BEFORE (BUGGY):
const today = new Date().toISOString().split('T')[0];
```

**Problem**: `.toISOString()` converts the date to UTC, which can shift the date:
- User in PST (UTC-8) at 11 PM on Dec 15, 2025
- `new Date()` creates: 2025-12-15T23:00:00-08:00 (local time)
- `.toISOString()` converts: 2025-12-16T07:00:00Z (UTC)
- `.split('T')[0]` gives: **"2025-12-16"** ❌ (wrong day!)

## Solution Implemented

### 1. Created Date Utility Functions (`lib/utils/date.ts`)

New utility functions that work with local timezone without UTC conversion:

- `formatDateLocal(date: Date)` - Format Date to YYYY-MM-DD in local timezone
- `getTodayLocal()` - Get today's date in local timezone
- `addDaysLocal(date, days)` - Add/subtract days in local timezone
- `parseDateLocal(dateStr)` - Parse YYYY-MM-DD to Date object
- Helper functions: `isToday()`, `isPast()`, `isFuture()`, `formatDateHuman()`

### 2. Updated Calendar Queries (`lib/queries/calendar.ts`)

```typescript
// AFTER (FIXED):
import { getTodayLocal, addDaysLocal } from '@/lib/utils/date';

const today = getTodayLocal(); // No UTC conversion!
const futureDateStr = addDaysLocal(new Date(), 14);
```

### 3. Updated Calendar Page (`app/(dashboard)/coach/college/calendar/page.tsx`)

```typescript
import { getTodayLocal } from '@/lib/utils/date';

const handleAddEvent = (type?: CalendarEventType) => {
  setPreselectedDate(getTodayLocal()); // No UTC conversion!
  // ...
};
```

### 4. Created Database Migration (`supabase/migrations/007_coach_calendar_events.sql`)

Created the `coach_calendar_events` and `coach_calendar_event_players` tables with:
- `event_date date NOT NULL` - Uses PostgreSQL DATE type (no timezone component)
- Proper indexes for performance
- Row Level Security (RLS) policies for data access control

## Testing Checklist

### Prerequisites
- [ ] Run database migration: `supabase db push`
- [ ] Ensure dev server is running: `npm run dev`
- [ ] Navigate to coach calendar page (requires coach account)

### Test Cases

#### Test 1: Create Event with Today's Date
1. Click "Add Event" button
2. Notice the date field pre-fills with today's date
3. Enter title: "Test Event - Today"
4. Click "Add Event"
5. **Expected**: Event appears on today's date in the calendar
6. **Expected**: Database shows correct date (no off-by-one error)

#### Test 2: Create Event with Future Date
1. Click on a future date in the calendar (e.g., 7 days from now)
2. Notice the date field pre-fills with the clicked date
3. Enter title: "Test Event - Future"
4. Click "Add Event"
5. **Expected**: Event appears on the selected date
6. **Expected**: Database shows correct date

#### Test 3: Edit Event Date
1. Click an existing event
2. Change the date to a different day
3. Click "Save Changes"
4. **Expected**: Event moves to the new date
5. **Expected**: Date doesn't shift by ±1 day

#### Test 4: Timezone Edge Case (Late Night)
**Best tested at 11 PM - 11:59 PM local time**
1. Create an event at 11:30 PM
2. Set date to today
3. Save the event
4. **Expected**: Event date matches today (not tomorrow)
5. **Verification**: Check database - `event_date` should match today's date

#### Test 5: Query Upcoming Events
1. Create events for: Today, +3 days, +7 days, +10 days, +20 days
2. Check "Upcoming Events" panel (shows next 14 days)
3. **Expected**: Shows first 4 events (within 14 days)
4. **Expected**: Does not show the +20 days event
5. **Expected**: All dates are correct (no off-by-one errors)

### Database Verification

```sql
-- Check event dates are stored correctly
SELECT
  id,
  title,
  event_date,
  type,
  created_at
FROM coach_calendar_events
ORDER BY event_date DESC
LIMIT 10;

-- Verify no timezone conversion happened
-- event_date should be DATE type (YYYY-MM-DD), not TIMESTAMP
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'coach_calendar_events'
  AND column_name = 'event_date';
-- Expected: data_type = 'date' (not 'timestamp with time zone')
```

## Technical Details

### Date Format Used

**Everywhere in the application**: `YYYY-MM-DD` (ISO 8601 date format)
- Example: `"2025-12-15"`
- This is the format returned by HTML `<input type="date">`
- This is the format stored in PostgreSQL `DATE` columns
- This format sorts correctly as strings

### Why No Timezone in Dates?

Calendar events happen on **specific days**, not specific moments in time:
- "Camp on December 15, 2025" means Dec 15 in the user's local timezone
- We don't need to know if it's Dec 15 in UTC, PST, EST, etc.
- Using DATE type (not TIMESTAMP) prevents timezone confusion

### Time Handling

Event times (start_time, end_time) are stored as PostgreSQL `TIME` type:
- Example: `"14:30"` (2:30 PM)
- No timezone component - interpreted as local time
- If timezone is needed in future, can be added separately

## Files Changed

1. **Created**:
   - `lib/utils/date.ts` - Date utility functions
   - `supabase/migrations/007_coach_calendar_events.sql` - Database schema
   - `CALENDAR_DATE_FIX_VERIFICATION.md` - This file

2. **Modified**:
   - `lib/queries/calendar.ts` - Use new date utilities
   - `app/(dashboard)/coach/college/calendar/page.tsx` - Use getTodayLocal()

## Acceptance Criteria

✅ All test cases pass without date shifting
✅ Events created at any time of day (including 11 PM) save with correct date
✅ Editing event dates doesn't cause off-by-one errors
✅ Upcoming events query returns correct date range
✅ No TypeScript errors
✅ No linting errors
✅ Database migration runs successfully

## Known Limitations

- This fix assumes users are working in their local timezone
- If multi-timezone support is needed (e.g., coach in EST scheduling event in PST location), additional timezone fields would be needed
- Current implementation is correct for single-timezone use case

## Future Enhancements

If timezone-aware events are needed:
1. Add `timezone` field to events (e.g., "America/Los_Angeles")
2. Display times in event's timezone, not user's timezone
3. Use `luxon` or `date-fns-tz` for timezone conversions
4. Show timezone indicator in UI (e.g., "2:00 PM PST")
