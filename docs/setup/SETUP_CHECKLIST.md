# ScoutPulse Setup Checklist

## ✅ Completed
- [x] Database tables created
- [x] RLS policies configured
- [x] Triggers and functions created
- [x] Environment variables configured (`.env.local`)

## 🔧 Next Steps

### 1. Install Dependencies

Make sure you have Node.js 18+ installed, then run:

```bash
npm install
```

Or if you're using yarn:
```bash
yarn install
```

Or if you're using pnpm:
```bash
pnpm install
```

### 2. Verify Environment Variables

Check that your `.env.local` file has the correct values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Start the Development Server

```bash
npm run dev
```

The app should start at: **http://localhost:3000**

### 4. Test the Application

#### Test Signup Flow
1. Go to http://localhost:3000
2. Click "Get Started" or "I'm a Player"
3. Fill out the signup form:
   - Select role (Player or Coach)
   - If Coach, select coach type
   - Enter email and password
4. After signup, you should be redirected to onboarding

#### Test Onboarding
- **Player**: Complete the 3-step onboarding (Home Base, Physical & Position, Goals)
- **Coach**: Complete the multi-step onboarding based on coach type

#### Verify Database
1. Go to your Supabase dashboard
2. Check **Table Editor** → `profiles` - should see your new profile
3. Check `players` or `coaches` - should see your record
4. Verify `onboarding_completed` is `false` initially

#### Complete Onboarding
1. Finish the onboarding steps
2. You should be redirected to your dashboard
3. Check Supabase - `onboarding_completed` should now be `true`

### 5. Test Key Features

#### As a Player:
- [ ] View your profile dashboard
- [ ] Browse programs in Discover
- [ ] Check Team page
- [ ] View Messages

#### As a Coach:
- [ ] View coach dashboard
- [ ] Use Discover to search players
- [ ] Create a camp event
- [ ] Edit program profile
- [ ] View watchlist

### 6. Verify Database Functions

In Supabase SQL Editor, test:

```sql
-- Test the state counts function
SELECT * FROM get_state_counts();
```

This should return player counts by state (empty if no players yet).

## 🐛 Troubleshooting

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

### "Cannot connect to Supabase"
- Verify `.env.local` has correct values
- Check Supabase dashboard is accessible
- Restart the dev server after changing `.env.local`

### "RLS policy violation"
- Check that you're signed in
- Verify the migration ran completely
- Check Supabase logs for specific policy errors

### Signup doesn't create records
- Check Supabase → Database → Functions → `handle_new_user` exists
- Check Database → Triggers → `on_auth_user_created` exists
- Check Supabase logs for trigger errors

### `updated_at` not auto-updating
- Verify triggers exist: `set_updated_at_*` triggers
- Check trigger function exists: `set_updated_at()`

## 📝 Quick Verification Commands

```bash
# Check Node version (should be 18+)
node --version

# Check if dependencies are installed
ls node_modules

# Start dev server
npm run dev

# Type check (optional)
npm run typecheck
```

## 🎉 You're Ready When:

- ✅ Dependencies installed
- ✅ Dev server running on localhost:3000
- ✅ Can sign up as player or coach
- ✅ Onboarding completes successfully
- ✅ Dashboard loads after onboarding
- ✅ Database records are created in Supabase

## 🚀 Next Steps After Setup

1. **Add test data**: Create a few test players and coaches
2. **Test messaging**: Set up conversations between players and coaches
3. **Test camps**: Create camp events and mark interest
4. **Customize**: Update branding, colors, and content
5. **Deploy**: When ready, deploy to Vercel or your hosting platform

---

**Need help?** Check the error messages in:
- Browser console (F12)
- Terminal where `npm run dev` is running
- Supabase dashboard → Logs

