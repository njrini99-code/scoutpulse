# Complete Testing Guide for ScoutPulse

## 🚀 Quick Start Testing

### Step 1: Add Service Role Key (Required for Seed Data)

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key
3. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 2: Seed Database

```bash
npm run seed
```

### Step 3: Start Dev Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📋 Complete Test Checklist

### 🔐 Authentication & Onboarding

#### Signup Flow
- [ ] **Homepage** → Click "Get Started"
- [ ] **Signup Page** → Select "Player" role
  - [ ] Enter full name
  - [ ] Enter email
  - [ ] Enter password
  - [ ] Submit form
  - [ ] Verify redirects to `/onboarding/player`
- [ ] **Signup as Coach** → Select "College Coach"
  - [ ] Complete signup
  - [ ] Verify redirects to `/onboarding/coach`

#### Player Onboarding (3 Steps)
- [ ] **Step 1: Player Basics**
  - [ ] Enter grad year
  - [ ] Enter high school
  - [ ] Enter showcase team (optional)
  - [ ] Enter height/weight
  - [ ] Select primary/secondary position
  - [ ] Select throws/bats
  - [ ] Click "Next"
- [ ] **Step 2: Optional Links**
  - [ ] Add Perfect Game URL (optional)
  - [ ] Add Twitter URL (optional)
  - [ ] Click "Next"
- [ ] **Step 3: Goals**
  - [ ] Select a goal
  - [ ] Click "Complete Profile"
  - [ ] Verify completion message
  - [ ] Verify redirects to `/player` dashboard

#### Coach Onboarding (2 Steps)
- [ ] **Step 1: Coach Identity**
  - [ ] Enter full name
  - [ ] Enter school/organization name
  - [ ] Enter city/state
  - [ ] Enter staff role
  - [ ] Click "Next"
- [ ] **Step 2: Program Basics**
  - [ ] Select program level
  - [ ] Enter program values
  - [ ] Enter about program
  - [ ] Upload logo/banner (optional)
  - [ ] Click "Complete"
  - [ ] Verify redirects to correct coach dashboard

#### Login Flow
- [ ] **Login Page** → Enter test credentials
  - [ ] Player: `jake.martinez@test.com` / `testpassword123`
  - [ ] Coach: `mthompson@stateuniv.edu` / `testpassword123`
- [ ] Verify correct dashboard routing
- [ ] Test logout

---

### 👤 Player Dashboard Tests

#### Profile Tab
- [ ] **Banner Section**
  - [ ] Profile photo displays (or initials)
  - [ ] Name, grad year, position show correctly
  - [ ] Social links work (if added)
  - [ ] "Share Profile" button works
  - [ ] "Edit Profile" button visible
- [ ] **About Me Tab**
  - [ ] Bio displays (if added)
  - [ ] Goal displays
- [ ] **Measurables Tab**
  - [ ] Basic info shows (height, weight, throws, bats)
  - [ ] Metrics display with values
  - [ ] Verified badges show (if applicable)
  - [ ] "Add Measurable" button works
- [ ] **Stats Tab**
  - [ ] Tabs work (Pitching, Hitting, Fielding, Game Logs)
  - [ ] Empty states show correctly
  - [ ] "Add Stats" buttons work
- [ ] **Videos Tab**
  - [ ] Game Footage tab shows videos
  - [ ] Training Footage tab shows videos
  - [ ] Video cards have hover effects
  - [ ] "Add Video" button works
- [ ] **Achievements Tab**
  - [ ] Achievements display
  - [ ] Dates show correctly
  - [ ] "Add Achievement" button works
- [ ] **Dream Schools Tab**
  - [ ] Top 5 schools display
  - [ ] School logos/initials show
  - [ ] "Add Dream Schools" button works
- [ ] **Verification Tab**
  - [ ] Verified metrics show
  - [ ] Coach endorsements section (empty state)

#### Discover Tab
- [ ] **Feed Section**
  - [ ] Feed items display
  - [ ] Program announcements show
  - [ ] "Mark Interested" buttons work
  - [ ] "Save" buttons work
- [ ] **Programs Section**
  - [ ] Programs list displays
  - [ ] Search works
  - [ ] Filters work (state, division)
  - [ ] Program cards are clickable
  - [ ] "Follow Program" buttons work
- [ ] **Recommended Section**
  - [ ] AI matches display
  - [ ] Match scores show
  - [ ] Reasons display
  - [ ] "Follow" and "Message" buttons work

#### Team Tab
- [ ] **Team Header**
  - [ ] Team logo/name displays
  - [ ] Coach info shows
  - [ ] Location displays
  - [ ] "Sync Calendar" button works
- [ ] **Roster Section**
  - [ ] Players list displays
  - [ ] Player cards are clickable
  - [ ] Player info shows (name, grad year, position)
- [ ] **Schedule Section**
  - [ ] Calendar displays
  - [ ] Events show (if any)
  - [ ] "Sync to Calendar" works
- [ ] **Announcements Section**
  - [ ] Messages from coach display
  - [ ] Empty state shows correctly

#### Messages Tab
- [ ] **Left Pane**
  - [ ] Conversations list displays
  - [ ] Search works
  - [ ] Filters work (Recruits, Team, Camps)
  - [ ] Unread badges show
- [ ] **Right Pane**
  - [ ] Chat view displays
  - [ ] Message history shows
  - [ ] Input field works
  - [ ] Send button works
  - [ ] Attachment buttons visible
  - [ ] Messages send successfully

---

### 🎓 Coach Dashboard Tests

#### Discover Tab
- [ ] **USA Map**
  - [ ] Map displays with states
  - [ ] Hover shows tooltip with counts
  - [ ] Click state opens drill-down view
  - [ ] States have hover effects
- [ ] **State Drill-Down**
  - [ ] Top recruits list shows
  - [ ] Teams list shows
  - [ ] "Back to Map" button works
  - [ ] Recruit cards are clickable
  - [ ] "Add to Watchlist" buttons work
- [ ] **Advanced Filters**
  - [ ] Position pills work (click to filter)
  - [ ] Grad year pills work
  - [ ] Measurables inputs work
  - [ ] Toggles work (Video Required, Verified Only)
  - [ ] "Clear All" button works
- [ ] **Trending Players**
  - [ ] Trending players display
  - [ ] View counts show
  - [ ] "Add to Watchlist" works
  - [ ] Cards have hover effects
- [ ] **AI Matches**
  - [ ] Match cards display
  - [ ] Match scores show (0-100)
  - [ ] Reasons display
  - [ ] "Watchlist" and "View Profile" buttons work

#### Player Profile (Coach View)
- [ ] **Recruit Snapshot**
  - [ ] Profile photo displays
  - [ ] All info displays correctly
  - [ ] "Add to Watchlist" button works
  - [ ] "Mark as Evaluated" button works
  - [ ] "Message Player" button works
  - [ ] "Add Note" button works
- [ ] **Measurables Tab**
  - [ ] Metrics display
  - [ ] Verified badges show
  - [ ] Sparklines show (placeholders)
- [ ] **Videos Tab**
  - [ ] Game/Training tabs work
  - [ ] Videos display
  - [ ] Video cards have hover effects
- [ ] **Stats Tab**
  - [ ] Tabs work (Hitting, Pitching, Fielding)
  - [ ] Stats display (if any)
- [ ] **Achievements Tab**
  - [ ] Achievements display
- [ ] **Academic Tab**
  - [ ] Academic info displays (if any)
- [ ] **Dream Schools Tab**
  - [ ] Schools display
  - [ ] Interest highlighting works
- [ ] **Notes Tab**
  - [ ] Notes section displays
  - [ ] "Add Note" button works

#### Watchlist Tab
- [ ] **Category Tabs**
  - [ ] All categories show (Pitchers, Hitters, etc.)
  - [ ] Counts display correctly
  - [ ] Clicking category filters recruits
- [ ] **Kanban Board**
  - [ ] 5 columns display (Watchlist, Evaluating, etc.)
  - [ ] Recruit cards in correct columns
  - [ ] Cards show all info (photo, name, position, measurables)
  - [ ] Interest level indicators show
  - [ ] Status icons show
  - [ ] Notes preview shows
  - [ ] "View" buttons work
  - [ ] Cards have hover effects
- [ ] **Search**
  - [ ] Search works
  - [ ] Filters work

#### Program Hub
- [ ] **Header**
  - [ ] Banner displays
  - [ ] Logo displays
  - [ ] "Verified Program" badge shows
  - [ ] Contact info displays
  - [ ] "Edit Program" button works
- [ ] **About Tab**
  - [ ] About section displays
  - [ ] Program values show
  - [ ] "What We Look For" shows
  - [ ] Academic profile shows
- [ ] **Facilities Tab**
  - [ ] Facility summary displays
  - [ ] Image placeholders show
  - [ ] Intro video section shows (if added)
- [ ] **Camps & Events Tab**
  - [ ] Camp events list displays
  - [ ] Event details show
  - [ ] "View Interested" buttons work
  - [ ] "Bulk Message" buttons work
  - [ ] "Add to Calendar" buttons work
  - [ ] "Create Camp" button works
- [ ] **Commitments Tab**
  - [ ] Placeholder displays correctly

#### Messages Tab
- [ ] **Left Pane**
  - [ ] Conversations list displays
  - [ ] Search works
  - [ ] Filters work (All, Recruits, Team)
  - [ ] Unread badges show
- [ ] **Right Pane**
  - [ ] Chat view displays
  - [ ] Message history shows
  - [ ] Send messages works
  - [ ] Attachment buttons visible

#### Calendar Tab
- [ ] **Upcoming Events**
  - [ ] Events list displays
  - [ ] Event details show
  - [ ] "Message" buttons work
  - [ ] "View" buttons work
- [ ] **Quick Actions**
  - [ ] "Add Evaluation Session" button works
  - [ ] "Schedule Player Visit" button works
  - [ ] "Sync Google Calendar" button works
- [ ] **Calendar View**
  - [ ] Placeholder displays correctly

---

### 🎨 UI/UX Testing

#### Hover Effects
- [ ] **Buttons**
  - [ ] Scale up on hover (1.05x)
  - [ ] Shadow intensifies
  - [ ] Gradient buttons have shimmer effect
  - [ ] Active state scales down (0.98x)
- [ ] **Cards**
  - [ ] Lift up on hover (-2px to -4px)
  - [ ] Scale slightly (1.01x to 1.02x)
  - [ ] Border glow appears
  - [ ] Shadow deepens
- [ ] **Badges**
  - [ ] Scale on hover (1.05x to 1.10x)
  - [ ] Border color changes
  - [ ] Shadow appears
- [ ] **Avatars/Initials**
  - [ ] Scale on hover (1.10x)
  - [ ] Shadow glow appears
  - [ ] Smooth transition
- [ ] **Video Cards**
  - [ ] Lift and scale on hover
  - [ ] Icon changes color
  - [ ] Background gradient appears
- [ ] **State Map Buttons**
  - [ ] Scale on hover
  - [ ] Border glow
  - [ ] Z-index elevation

#### Transitions
- [ ] All animations are smooth (300ms)
- [ ] No janky movements
- [ ] Ease-out timing feels natural
- [ ] Colors transition smoothly

#### Responsive Design
- [ ] **Mobile (< 768px)**
  - [ ] Navigation collapses to mobile menu
  - [ ] Cards stack vertically
  - [ ] Forms are usable
  - [ ] Buttons are touch-friendly
  - [ ] Text is readable
- [ ] **Tablet (768px - 1024px)**
  - [ ] Layout adapts correctly
  - [ ] Grids adjust
  - [ ] Navigation works
- [ ] **Desktop (> 1024px)**
  - [ ] Full layout displays
  - [ ] Multi-column grids work
  - [ ] Hover effects work

---

### 🔍 Functional Testing

#### Data Loading
- [ ] All pages load data correctly
- [ ] Loading states show
- [ ] Empty states show when no data
- [ ] Error states handle gracefully

#### Filtering & Search
- [ ] **Player Discover**
  - [ ] Search works
  - [ ] Filters work (state, division)
  - [ ] Results update correctly
- [ ] **Coach Discover**
  - [ ] Position filters work
  - [ ] Grad year filters work
  - [ ] Measurables filters work
  - [ ] State filters work
  - [ ] Combined filters work

#### Interactions
- [ ] **Add to Watchlist**
  - [ ] Button works
  - [ ] Toast notification shows
  - [ ] Recruit appears in watchlist
- [ ] **Follow Program**
  - [ ] Button works
  - [ ] Program appears in feed
- [ ] **Send Message**
  - [ ] Message sends
  - [ ] Appears in conversation
  - [ ] Updates conversation list
- [ ] **Mark Interested (Camp)**
  - [ ] Button works
  - [ ] Count updates
  - [ ] Coach can see interested players

---

### 🐛 Error Handling

- [ ] **Network Errors**
  - [ ] Graceful error messages
  - [ ] Retry options
  - [ ] No crashes
- [ ] **Missing Data**
  - [ ] Empty states display
  - [ ] Helpful messages
  - [ ] CTAs to add data
- [ ] **Invalid Input**
  - [ ] Form validation works
  - [ ] Error messages show
  - [ ] Can't submit invalid forms
- [ ] **Auth Errors**
  - [ ] Redirects to login when needed
  - [ ] Clear error messages
  - [ ] Session handling works

---

### ⚡ Performance

- [ ] **Page Load**
  - [ ] Initial load < 2 seconds
  - [ ] Navigation is instant
  - [ ] No long pauses
- [ ] **Animations**
  - [ ] Smooth 60fps
  - [ ] No stuttering
  - [ ] No layout shifts
- [ ] **Console**
  - [ ] No errors in console
  - [ ] No warnings (or minimal)
  - [ ] No memory leaks

---

## 🎯 Priority Test Scenarios

### Must Test (Critical Path)
1. ✅ Signup → Onboarding → Dashboard (Player)
2. ✅ Signup → Onboarding → Dashboard (Coach)
3. ✅ Login with test accounts
4. ✅ Coach Discover → View Player → Add to Watchlist
5. ✅ Player Discover → View Program → Follow
6. ✅ Send message (both directions)

### Should Test (Important)
1. ✅ Edit profile
2. ✅ Create camp event
3. ✅ Add metrics/videos/achievements
4. ✅ Filter and search
5. ✅ Team roster and schedule

### Nice to Test (Polish)
1. ✅ All hover effects
2. ✅ Mobile responsiveness
3. ✅ Error scenarios
4. ✅ Performance

---

## 🚨 Known Issues to Watch For

1. **TypeScript Error**: There's a file `components/coach/college/discover-team-list.tsx` with syntax errors (may not be used)
2. **Service Role Key**: Required for seed script
3. **Conversations/Messages**: Tables may not exist in schema yet
4. **Camp Interests**: Counts are placeholders (0)

---

## 📊 Test Results Template

```
Date: __________
Tester: __________

Authentication: [ ] Pass [ ] Fail
Player Dashboard: [ ] Pass [ ] Fail  
Coach Dashboard: [ ] Pass [ ] Fail
UI/UX: [ ] Pass [ ] Fail
Performance: [ ] Pass [ ] Fail

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## 🎉 Success Criteria

The app is ready when:
- ✅ All critical paths work end-to-end
- ✅ No console errors
- ✅ UI feels polished and responsive
- ✅ Data displays correctly
- ✅ Interactions feel smooth
- ✅ Mobile works well

**Ready to test!** 🚀

