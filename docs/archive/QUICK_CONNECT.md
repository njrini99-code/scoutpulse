# Quick Supabase Connection - 3 Steps

## ✅ Step 1: Get Your Keys

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://blspsttgyxuoqhskpmrg.supabase.co`
   - **anon public key**: (the long JWT token)

## ✅ Step 2: Add to .env.local

Create/update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

## ✅ Step 3: Test Connection

```bash
npm run test:supabase
```

If you see ✅ "Connected to Supabase successfully!" - you're done!

---

## 🔍 Current Status

Your `.env.local` already has:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set (verify it's correct)
- ✅ `DATABASE_URL` - Set (optional, for direct PostgreSQL)

**Test it now:**
```bash
npm run test:supabase
```

---

## 📝 What Each Key Does

- **NEXT_PUBLIC_SUPABASE_URL**: Your project's API endpoint
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Public API key (safe for client-side)
- **DATABASE_URL**: Direct PostgreSQL connection (optional, for admin tasks)

---

## 🚀 You're Connected!

Your application uses the Supabase client automatically. Just import:

```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

That's it! 🎉

