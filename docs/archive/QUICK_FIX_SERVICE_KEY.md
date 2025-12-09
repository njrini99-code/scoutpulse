# Quick Fix: Add Service Role Key

## ✅ I've Added a Placeholder

I've added this line to your `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
```

## 🔧 Now Replace It With Your Actual Key

1. **Get your service role key:**
   - Go to: https://supabase.com/dashboard
   - Settings → API
   - Find **service_role** key (not anon)
   - Click "Reveal" or copy it

2. **Replace the placeholder:**
   - Open `.env.local`
   - Find: `SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE`
   - Replace `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` with your actual key
   - Save the file

3. **Verify it worked:**
   ```bash
   grep SUPABASE_SERVICE_ROLE_KEY .env.local
   ```
   You should see your key (it will be a long JWT token starting with `eyJ`)

4. **Test it:**
   ```bash
   npm run seed
   ```

## 📝 Your .env.local Should Have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  ← Replace this
DATABASE_URL=postgresql://postgres:...
```

## ⚠️ Important

- The service role key is **different** from the anon key
- It's longer and has admin permissions
- Make sure you copy the **entire** key (it's very long)
- No spaces around the `=` sign

