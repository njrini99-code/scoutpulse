# Quick Test Guide

## 🚀 Get Started in 3 Steps

### 1. Add Service Role Key (if you want seed data)

```env
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

### 2. Seed Database (Optional but Recommended)

```bash
npm run seed
```

### 3. Start Testing!

The dev server should already be running at **http://localhost:3000**

---

## 🎯 Quick Test Paths

### Test Player Flow (5 minutes)
1. Go to http://localhost:3000
2. Click "Get Started" → Sign up as Player
3. Complete 3-step onboarding
4. Explore Player Dashboard:
   - Profile tab (see metrics, videos)
   - Discover tab (browse programs)
   - Team tab
   - Messages tab

### Test Coach Flow (5 minutes)
1. Sign up as "College Coach"
2. Complete 2-step onboarding
3. Explore Coach Dashboard:
   - Discover tab (USA Map, filters, trending)
   - Watchlist tab (Kanban board)
   - Program Hub
   - Messages tab
   - Calendar tab

### Test with Seed Data (if you ran seed script)
1. Login as: `jake.martinez@test.com` / `testpassword123`
2. You'll see a populated dashboard with:
   - Metrics, videos, achievements
   - Programs to discover
   - Watchlist entries (as coach)

---

## ✅ What to Check

### UI Polish
- [ ] Buttons pop on hover (scale + glow)
- [ ] Cards lift on hover
- [ ] Smooth transitions everywhere
- [ ] Colors look modern and premium

### Functionality
- [ ] Signup creates account
- [ ] Onboarding saves data
- [ ] Dashboard loads correctly
- [ ] Navigation works
- [ ] Filters/search work

### Data
- [ ] Player profiles show data
- [ ] Coach discover shows players
- [ ] Watchlist displays recruits
- [ ] Messages work

---

## 🐛 If Something Doesn't Work

1. **Check browser console** (F12) for errors
2. **Check Network tab** for failed requests
3. **Verify .env.local** has correct keys
4. **Check Supabase Dashboard** - are tables populated?
5. **Try logging out and back in**

---

## 📝 Test Accounts (After Seeding)

**Players:**
- jake.martinez@test.com / testpassword123
- marcus.johnson@test.com / testpassword123

**Coaches:**
- mthompson@stateuniv.edu / testpassword123
- smartinez@regionalcollege.edu / testpassword123

---

**Happy Testing!** 🎉

