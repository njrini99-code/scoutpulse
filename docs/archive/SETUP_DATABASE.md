# Setting Up Your New Supabase Database

Follow these steps to create a fresh Supabase database for ScoutPulse.

## Step 1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `scoutpulse` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine to start
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long JWT token)

3. Copy both of these values - you'll need them in Step 4

## Step 3: Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy **ALL** the contents of that file
5. Paste it into the SQL Editor in Supabase
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this means it worked!

## Step 4: Update Your Environment Variables

1. In your project root, open or create `.env.local`
2. Replace the values with your new Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 5: Verify Everything Works

1. Make sure your `.env.local` file is saved
2. Restart your Next.js dev server if it's running:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```
3. Go to [http://localhost:3000](http://localhost:3000)
4. Try signing up as a player or coach
5. Check your Supabase dashboard → **Table Editor** to see if records are being created

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire migration SQL file
- Check that all tables were created in **Table Editor**

### "permission denied" error
- The RLS policies should allow authenticated users
- Make sure you're signed in when testing

### Can't see tables in Supabase
- Go to **Table Editor** in the left sidebar
- You should see: `profiles`, `players`, `coaches`, `camp_events`, etc.

### Signup not creating records
- Check the **Database** → **Functions** to see if `handle_new_user` exists
- Check **Database** → **Triggers** to see if `on_auth_user_created` exists
- If missing, re-run the migration SQL

## What Gets Created

The migration creates:

### Tables
- `profiles` - User roles (player/coach)
- `players` - Player profiles
- `coaches` - Coach profiles (all types)
- `camp_events` - Recruiting camps/events
- `teams` - High school/showcase teams
- `team_memberships` - Player-team relationships
- `recruits` - Coach watchlist/recruiting pipeline
- `player_metrics` - Player stats
- `player_videos` - Video library
- `player_achievements` - Awards and accomplishments

### Security
- Row Level Security (RLS) enabled on all tables
- Policies for players to manage their own data
- Policies for coaches to view players and manage their own data

### Functions & Triggers
- `handle_new_user()` - Automatically creates profile/player/coach records on signup
- `get_state_counts()` - Returns player counts by state for the discover map

## Next Steps

Once your database is set up:
1. Test the signup flow
2. Complete onboarding as both a player and coach
3. Test the discover/search features
4. Create some test data to see everything working

You're all set! 🎉

