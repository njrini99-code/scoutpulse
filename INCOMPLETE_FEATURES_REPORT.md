# Incomplete Features & Non-Functional Elements Report

**Generated:** December 9, 2025
**Status:** Comprehensive Analysis
**Total Issues Found:** 20+ incomplete features

---

## 🔴 HIGH PRIORITY - User-Facing Issues

### 1. **Google Calendar Integration** ❌
**Location:** `app/(dashboard)/coach/college/settings/page.tsx:281, 285, 192`

**What's Missing:**
- "Connect Google Calendar" button shows "Coming Soon" toast
- "Sync Now" button shows "Coming Soon" toast
- No actual OAuth flow or calendar sync implemented

**User Impact:** ⚠️ HIGH
- Coaches cannot sync recruiting calendar with Google Calendar
- Must manually duplicate all events in both systems
- Major time waste for busy coaches

**Fix Needed:**
- Implement Google Calendar OAuth flow
- Create sync logic for calendar events
- Handle two-way sync (ScoutPulse ↔ Google)

---

### 2. **Mock Player Dashboard Stats** 🎭
**Locations:**
- `components/player/dashboard/Overview/player-overview-quick-stats.tsx:8`
- `components/player/dashboard/Overview/player-overview-recent-games.tsx:18`
- `components/player/dashboard/Overview/player-overview-showcase-highlight.tsx:15`

**What's Missing:**
- Quick Stats showing hardcoded values (PPG: 20.7, RPG: 6.1, etc.)
- Recent Games using placeholder data
- Showcase Highlights not pulling from evaluations

**User Impact:** ⚠️ HIGH
- Players see fake stats instead of their actual performance
- Misleading information that doesn't reflect reality
- Cannot track real progress

**Fix Needed:**
- Connect to actual player_metrics table
- Query recent game stats from database
- Pull evaluations from scout cards

---

### 3. **Team Media Delete Buttons** ❌
**Location:** `components/team/team-media.tsx:176, 222`

**What's Missing:**
- Delete buttons exist but have `// TODO: Implement delete` comment
- No actual delete functionality

**User Impact:** ⚠️ MEDIUM
- Cannot remove uploaded photos/videos
- Storage fills up with unwanted media
- No way to fix mistakes

**Fix Needed:**
- Implement delete mutation
- Remove from Supabase Storage
- Update UI after deletion

---

### 4. **Staff Management (Frontend Only)** 🎭
**Location:** `app/(dashboard)/coach/college/settings/page.tsx:156-160`

**What's Missing:**
- Staff data is hardcoded mock array
- Added staff only stored in React state
- No database persistence

**User Impact:** ⚠️ MEDIUM
- Staff members lost on page refresh
- Cannot actually manage coaching staff
- Misleading feature that appears to work

**Fix Needed:**
- Create `staff` or `coaching_staff` table
- Implement CRUD operations
- Persist to database

---

### 5. **Scout Card Notes (No Database Save)** ❌
**Location:** `app/(dashboard)/coach/college/discover/page.tsx:323`

**What's Missing:**
- "Add Note" shows success toast
- `// TODO: Implement note adding in database`
- Notes are not saved anywhere

**User Impact:** ⚠️ MEDIUM
- Coaches think they're saving notes
- Notes are lost immediately
- Cannot track recruit information

**Fix Needed:**
- Create notes table or add notes column
- Implement save to database
- Load notes when viewing scout cards

---

## 🟡 MEDIUM PRIORITY - Database Schema Issues

### 6. **Missing Team Schedule Table** ❌
**Location:** `lib/queries/team.ts:147, 210, 255, 306, 348, 367`

**What's Missing:**
- Multiple `TODO: Use team_schedule table when migration is added`
- Currently using `camp_events` as placeholder
- No proper team schedule management

**User Impact:** ⚠️ MEDIUM
- Team schedules incomplete
- Using wrong table for data
- May cause data conflicts

**Fix Needed:**
- Create `team_schedule` migration
- Update all queries to use new table
- Migrate existing data

---

### 7. **Missing Team Columns** ❌
**Location:** `lib/queries/team.ts:182-184`

**What's Missing:**
- Jersey numbers column
- Team status column
- Primary team column

**User Impact:** ⚠️ MEDIUM
- Cannot assign jersey numbers to players
- Cannot mark players as inactive/active
- Cannot distinguish primary vs. secondary teams

**Fix Needed:**
- Add database migration for columns
- Update team queries
- Add UI for jersey number assignment

---

### 8. **Recruit Watchlist Table Not Migrated** ❌
**Location:** `lib/queries/watchlist.ts:22`

**What's Missing:**
- `// TODO: Add Supabase migration for recruit_watchlist table and policies`
- May be using old/incomplete schema

**User Impact:** ⚠️ MEDIUM
- Watchlist may not persist correctly
- RLS policies might be missing
- Data integrity issues

**Fix Needed:**
- Verify table exists
- Create proper migration if missing
- Add RLS policies

---

## 🟢 LOW PRIORITY - Missing Integrations

### 9. **Email Sequences Not Sent** 📧
**Location:** `lib/emails/emailSequence.ts:30, 84, 135`

**What's Missing:**
- Multiple `// TODO: Integrate with email service`
- Welcome emails, follow-ups, reminders not sent
- Only email templates exist, no sending logic

**User Impact:** ⚠️ LOW-MEDIUM
- Automated communication not working
- Manual email sending required
- Reduced engagement

**Fix Needed:**
- Integrate with Resend or SendGrid
- Implement email queue
- Add email preferences

---

### 10. **Error Tracking Not Integrated** 📊
**Location:** `lib/utils/errorLogger.ts:52`

**What's Missing:**
- `// TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)`
- Errors only logged to console
- No centralized monitoring

**User Impact:** ⚠️ LOW
- Errors go unnoticed in production
- Cannot track issues proactively
- Harder to debug problems

**Fix Needed:**
- Integrate Sentry (recommended in action plan)
- Configure error boundaries
- Setup alerts

---

## 🎨 FEATURES WITH LIMITED FUNCTIONALITY

### 11. **Drag-and-Drop Pipeline** 🎯
**Location:** `components/coach/college/recruiting-pipeline.tsx`

**What's Missing:**
- Recruiting pipeline has structure for drag-and-drop
- Currently uses dropdown menu to change status
- No actual drag-and-drop implementation

**User Impact:** ⚠️ LOW
- Less intuitive UI
- More clicks required to move recruits
- Not as polished

**Fix Needed:**
- Install @dnd-kit/core
- Implement drag handlers
- Update status on drop

**Note:** This is tracked in TECHNICAL_DEBT.md as LOW-003

---

### 12. **Recruiting Planner Fallback Data** 🎭
**Location:** `app/(dashboard)/coach/college/recruiting-planner/page.tsx:95-118`

**What's Missing:**
- Shows sample players (Cole Mitchell, Jake Miller, etc.) when no real data
- Hardcoded `SAMPLE_PIPELINE` used as fallback

**User Impact:** ⚠️ LOW
- Confusing for new users
- Looks like real data
- Should show empty state instead

**Fix Needed:**
- Replace sample data with proper empty state
- Add "Add First Recruit" CTA
- Clear messaging

---

### 13. **Team Commitment Tracking** ❌
**Location:** `lib/queries/team.ts:553`

**What's Missing:**
- `// TODO: Implement actual commitment tracking`
- Cannot track which players committed to teams

**User Impact:** ⚠️ LOW
- Manual tracking required
- Missing important recruiting metric
- No commitment timeline

**Fix Needed:**
- Add commitment tracking logic
- Create commitment history table
- Add UI for marking commitments

---

### 14. **Top Prospects Filter** 🔍
**Location:** `lib/api/hs/getHighSchoolRoster.ts:134`

**What's Missing:**
- `// TODO: top prospects filter when tags/flag exist`
- Cannot filter roster for top prospects

**User Impact:** ⚠️ LOW
- Less efficient roster browsing
- Cannot highlight star players
- Manual filtering needed

**Fix Needed:**
- Add prospect_rating or tags column
- Implement filter logic
- Add UI toggle

---

### 15. **Team Reports Player Names** 🏷️
**Location:** `components/team/team-reports.tsx:191`

**What's Missing:**
- `// TODO: Fetch player name from player_id`
- May show IDs instead of names

**User Impact:** ⚠️ LOW
- Confusing team reports
- Hard to identify players
- Poor UX

**Fix Needed:**
- Join with players table
- Fetch and display names
- Handle missing players

---

### 16. **High School Team Creation Flow** ❌
**Location:** `app/(dashboard)/coach/high-school/team/page.tsx:80`

**What's Missing:**
- `// TODO: Create team if doesn't exist or redirect to create`
- Coaches without teams see error

**User Impact:** ⚠️ LOW
- Poor onboarding experience
- Confusing error message
- No clear next step

**Fix Needed:**
- Add team creation modal
- Redirect to creation flow
- Better empty state

---

## 📊 SUMMARY BY SEVERITY

| Priority | Count | Impact |
|----------|-------|--------|
| 🔴 **High** | 5 | User-facing broken features |
| 🟡 **Medium** | 3 | Database/schema issues |
| 🟢 **Low** | 8 | Missing polish/integrations |
| **Total** | **16** | **Documented incomplete features** |

---

## 🎯 RECOMMENDED PRIORITY ORDER

### **This Week (Fix User-Facing Issues):**

1. **Fix Mock Player Stats** (2 hours)
   - Connect to real player_metrics
   - Remove hardcoded data
   - Show actual performance

2. **Implement Scout Card Notes Save** (1 hour)
   - Add notes column or table
   - Save to database
   - Load on page

3. **Fix Team Media Delete** (1 hour)
   - Implement delete logic
   - Remove from storage
   - Update UI

### **Next Week (Schema & Integrations):**

4. **Create Team Schedule Migration** (2 hours)
5. **Add Missing Team Columns** (1 hour)
6. **Integrate Email Service** (2 hours)
7. **Staff Management Database** (2 hours)

### **Later (Polish & Enhancements):**

8. **Google Calendar Integration** (4-6 hours)
9. **Drag-and-Drop Pipeline** (3 hours)
10. **Error Tracking (Sentry)** (1 hour)

---

## 📝 NOTES

### **Testing Incomplete Features:**
- Some features marked as incomplete in test files are expected (test helpers)
- Auth helpers in tests are templates, not bugs

### **What's Actually Working:**
- ✅ Real-time messaging
- ✅ Real-time notifications
- ✅ Player discovery (USA map)
- ✅ Recruiting intelligence (trending, AI matching)
- ✅ Watchlist management (add/remove)
- ✅ Profile creation & editing
- ✅ Authentication & onboarding
- ✅ Analytics dashboard structure

### **Documentation:**
All incomplete features are now tracked in:
- This report: `INCOMPLETE_FEATURES_REPORT.md`
- Technical debt: `TECHNICAL_DEBT.md`
- Priority plan: `PRIORITY_ACTION_PLAN.md`

---

## 🔧 HOW TO FIX

### **For Each Feature:**

1. **Identify:** Find the TODO comment or incomplete logic
2. **Plan:** Determine database changes needed
3. **Implement:** Write the code
4. **Test:** Verify functionality works
5. **Remove:** Delete TODO comments
6. **Update:** Mark as complete in tracking docs

### **Example: Fixing Scout Card Notes**

```typescript
// Before (incomplete):
const handleAddNote = () => {
  // TODO: Implement note adding in database
  toast.success("Note added!");
};

// After (complete):
const handleAddNote = async (note: string) => {
  const { data, error } = await supabase
    .from('recruit_notes')
    .insert({ recruit_id, coach_id, note, created_at: new Date() });

  if (error) {
    toast.error("Failed to save note");
    return;
  }

  toast.success("Note saved!");
  refreshNotes();
};
```

---

**Want me to start fixing any of these features?**

I can tackle them in priority order, starting with the user-facing issues that have the highest impact.
