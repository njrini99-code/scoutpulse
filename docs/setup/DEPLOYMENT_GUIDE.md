# Deployment Guide for ScoutPulse

## Quick Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

3. **Click "New Project"** and import your ScoutPulse repository

4. **Configure Environment Variables:**
   - Add these from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Any other environment variables you're using

5. **Deploy!** Vercel will automatically:
   - Detect Next.js
   - Run `npm run build`
   - Deploy your app

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **For production:**
   ```bash
   vercel --prod
   ```

## Environment Variables Needed

Make sure to set these in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- Any other API keys you're using

## Build Configuration

The project is configured to:
- Use webpack for builds (handles Turbopack compatibility)
- Exclude `src/` directory (legacy code)
- Support dynamic pages

## Troubleshooting

If you see build errors:
1. Check that all environment variables are set
2. Ensure Supabase is accessible
3. Check build logs in Vercel dashboard

