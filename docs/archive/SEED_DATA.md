# Seed Data Script

This script populates your ScoutPulse database with sample data for testing and development.

## Prerequisites

1. **Database Migration**: Make sure you've run the database migration (`supabase/migrations/001_initial_schema.sql`) in your Supabase SQL Editor.

2. **Service Role Key**: You need your Supabase Service Role Key to run this script (it bypasses RLS to insert data).

   - Go to your Supabase Dashboard → Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - Add it to your `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   ⚠️ **Important**: Never commit the service role key to git! It has admin access to your database.

## Running the Script

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed-data.js
```

## What Gets Created

### Players (10 sample players)
- Full profiles with names, positions, measurables
- Metrics (velocity, speed, etc.)
- Videos (game and training footage)
- Achievements
- Dream schools
- All from Texas (for easy filtering)

### Coaches (5 sample coaches)
- 2 College coaches (D1 and D2)
- 1 JUCO coach
- 1 High School coach
- 1 Showcase coach
- Full program profiles

### Camp Events (3 events)
- Spring Prospect Camp
- Summer Showcase
- Elite Training Camp

### Teams
- Central High School Varsity team
- 5 players added as members

### Watchlist
- 5 players added to first college coach's watchlist
- Various stages (Watchlist, Evaluating, High Priority, Offered)

## Test Accounts

After running the script, you can log in with:

**Players:**
- `jake.martinez@test.com` / `testpassword123`
- `marcus.johnson@test.com` / `testpassword123`
- `tyler.williams@test.com` / `testpassword123`

**Coaches:**
- `mthompson@stateuniv.edu` / `testpassword123` (College D1)
- `smartinez@regionalcollege.edu` / `testpassword123` (College D2)

## Notes

- The script is **idempotent** - you can run it multiple times safely
- Existing users won't be recreated
- New data will be added to existing users
- All players and coaches have `onboarding_completed: true` so you can access dashboards immediately

## Troubleshooting

**Error: "Missing SUPABASE_SERVICE_ROLE_KEY"**
- Make sure you've added the service role key to `.env.local`
- Restart your terminal/IDE after adding it

**Error: "relation does not exist"**
- Make sure you've run the database migration first
- Check that all tables exist in your Supabase database

**Error: "permission denied"**
- Make sure you're using the service role key, not the anon key
- The service role key bypasses RLS policies

**Users already exist**
- This is normal! The script will skip creating duplicate users
- It will still add metrics, videos, etc. to existing users

