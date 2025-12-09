# Supabase Connection Setup Guide

## 📋 Step-by-Step Instructions

### Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on your project: `blspsttgyxuoqhskpmrg`

3. **Get API Credentials**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** in the settings menu
   - You'll see two important values:

   **Project URL:**
   ```
   https://blspsttgyxuoqhskpmrg.supabase.co
   ```

   **API Keys:**
   - `anon` `public` key (this is what you need)
   - Copy the `anon` `public` key

### Step 2: Set Up Environment Variables

1. **Open your `.env.local` file** in the project root
   - If it doesn't exist, create it

2. **Add these lines:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Replace `your-anon-key-here`** with the actual anon key from Step 1

4. **Save the file**

### Step 3: Verify Your Setup

1. **Check your `.env.local` file contains:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Test the connection:**
   ```bash
   npm run test:supabase
   ```

3. **You should see:**
   ```
   ✅ Connected to Supabase successfully!
   📊 Data Counts: ...
   ⚡ Query Performance: XXms
   ✅ All tests passed!
   ```

### Step 4: (Optional) Get Database Password for Direct Connection

If you need direct PostgreSQL access (for migrations, admin tasks):

1. **Go to Supabase Dashboard** → **Settings** → **Database**

2. **Find "Connection string" section**

3. **Select "URI" format**

4. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

5. **Add to `.env.local`:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@...
   ```

6. **Test direct connection:**
   ```bash
   npm run test:db
   ```

## ✅ Verification Checklist

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] `npm run test:supabase` passes
- [ ] Application can connect to Supabase

## 🔒 Security Notes

1. **Never commit `.env.local` to git**
   - It's already in `.gitignore`
   - Contains sensitive credentials

2. **The `anon` key is safe for client-side use**
   - It's designed to be public
   - RLS policies protect your data

3. **Keep your database password secret**
   - Only use `DATABASE_URL` for admin tasks
   - Don't expose it in client-side code

## 🚀 Using Supabase in Your Code

### Client-Side (React Components)
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Example: Fetch players
const { data, error } = await supabase
  .from('players')
  .select('*');
```

### Server-Side (API Routes, Server Components)
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

// Example: Fetch players
const { data, error } = await supabase
  .from('players')
  .select('*');
```

## 🐛 Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Check `.env.local` exists
- Verify the variable name is exactly `NEXT_PUBLIC_SUPABASE_URL`
- Restart your dev server after adding env variables

### "Invalid API key"
- Verify you copied the `anon` `public` key (not the `service_role` key)
- Check for extra spaces or line breaks
- Make sure the key starts with `eyJ`

### "Connection failed"
- Verify your project URL is correct
- Check your internet connection
- Ensure your Supabase project is active

### "RLS policy violation"
- This is normal - RLS policies are protecting your data
- Make sure you're authenticated if querying protected data
- Check your RLS policies in Supabase Dashboard

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js + Supabase**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

## 🎯 Quick Start Commands

```bash
# Test Supabase connection
npm run test:supabase

# Start development server
npm run dev

# Run database seed (if you have service role key)
npm run seed
```

---

**Your connection is ready when `npm run test:supabase` passes!** ✅

