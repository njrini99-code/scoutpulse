# ScoutPulse Testing Guide

## Quick Setup for Testing

### 1. Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **service_role** key (under "Project API keys")
5. Copy it (it's different from the anon key)

### 2. Add to .env.local

Add this line to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Never commit this key to git!** It has admin access to your database.

### 3. Run Seed Script

```bash
npm run seed
```

This will create:
- 10 test players
- 5 test coaches
- Camp events
- Teams
- Watchlist entries

## Testing Checklist

### ✅ Authentication Flow

**Test Signup:**
1. Go to `/auth/signup`
2. Create a new player account
3. Verify redirects to onboarding
4. Complete onboarding
5. Verify redirects to player dashboard

**Test Login:**
- Use test accounts from seed script
- Verify correct dashboard routing
- Test logout

### ✅ Player Dashboard

**Profile Tab:**
- [ ] View player profile
- [ ] See metrics, videos, achievements
- [ ] Edit profile button (should work)
- [ ] Share profile button
- [ ] Dream schools display

**Discover Tab:**
- [ ] See feed items
- [ ] Browse programs
- [ ] Use filters (state, division)
- [ ] View program details
- [ ] Follow programs

**Team Tab:**
- [ ] View team roster
- [ ] See schedule
- [ ] View announcements

**Messages Tab:**
- [ ] See conversations list
- [ ] Send messages
- [ ] Search conversations

### ✅ Coach Dashboard

**Discover Tab:**
- [ ] USA Map displays
- [ ] Click state to drill down
- [ ] See top recruits
- [ ] Use advanced filters
- [ ] View trending players
- [ ] See AI matches

**Watchlist Tab:**
- [ ] See recruits in Kanban board
- [ ] Filter by category
- [ ] Search recruits
- [ ] View recruit details

**Player Profile (Coach View):**
- [ ] Click "View Player" from discover
- [ ] See full player profile
- [ ] Add to watchlist
- [ ] Mark as evaluated
- [ ] View metrics, videos, stats

**Program Hub:**
- [ ] View program page
- [ ] See facilities section
- [ ] View camps & events
- [ ] Edit program info

**Messages Tab:**
- [ ] See conversations
- [ ] Send messages to players
- [ ] Filter conversations

**Calendar Tab:**
- [ ] See upcoming events
- [ ] View event details
- [ ] Quick actions work

### ✅ UI/UX Testing

**Hover Effects:**
- [ ] Buttons scale and glow on hover
- [ ] Cards lift and show border glow
- [ ] Badges scale on hover
- [ ] Avatars scale smoothly
- [ ] Video cards have hover effects

**Transitions:**
- [ ] All animations are smooth (300ms)
- [ ] No janky movements
- [ ] Colors transition nicely

**Responsive:**
- [ ] Test on mobile viewport
- [ ] Navigation works on mobile
- [ ] Cards stack properly
- [ ] Forms are usable

### ✅ Data Flow

**Player Data:**
- [ ] Metrics display correctly
- [ ] Videos show in correct tabs
- [ ] Achievements appear
- [ ] Stats sections work

**Coach Data:**
- [ ] Programs show in discover
- [ ] Watchlist loads correctly
- [ ] Camp events display
- [ ] Team rosters show

**Interactions:**
- [ ] Add to watchlist works
- [ ] Filtering works
- [ ] Search works
- [ ] Navigation is smooth

## Common Issues & Fixes

### Issue: "Service role key missing"
**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### Issue: "No players found"
**Fix:** Run `npm run seed` to populate data

### Issue: "RLS policy violation"
**Fix:** Make sure you're logged in as the correct user type

### Issue: "Cannot read property of undefined"
**Fix:** Check that data exists in database, verify RLS policies

### Issue: "Button doesn't do anything"
**Fix:** Check browser console for errors, verify function is implemented

## Performance Testing

- [ ] Pages load quickly (< 2s)
- [ ] No console errors
- [ ] Smooth scrolling
- [ ] Images load properly
- [ ] No memory leaks

## Browser Testing

Test in:
- [ ] Chrome/Edge
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Next Steps After Testing

1. **Fix any bugs found**
2. **Implement missing features** (from placeholder buttons)
3. **Add error boundaries**
4. **Optimize performance**
5. **Add more seed data** if needed

