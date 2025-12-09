# How to Add SUPABASE_SERVICE_ROLE_KEY

## Step-by-Step Instructions

### 1. Get Your Service Role Key

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **Project API keys** section
5. Find **service_role** key (it's different from the anon key)
6. Click **Reveal** or **Copy** to get the full key

### 2. Add to .env.local

Open your `.env.local` file and add this line:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:**
- Replace `your-service-role-key-here` with the actual key
- No spaces around the `=` sign
- The key should be a long JWT token (starts with `eyJ`)
- Make sure it's on its own line

### 3. Verify It Was Added

Run this command:
```bash
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

You should see the line with your key.

### 4. Test It Works

```bash
npm run seed
```

If it works, you'll see seed data being created. If not, check:
- The key is correct (no extra spaces)
- The key is the **service_role** key (not anon)
- The file was saved

## Example .env.local Format

Your `.env.local` should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blspsttgyxuoqhskpmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:DrSgD9tC6D1ZilAZ@db.blspsttgyxuoqhskpmrg.supabase.co:5432/postgres
```

## Common Issues

### "Key not found"
- Make sure the variable name is exactly: `SUPABASE_SERVICE_ROLE_KEY`
- Check for typos
- Make sure there are no spaces: `KEY=value` not `KEY = value`

### "Wrong key"
- Make sure you're using the **service_role** key, not the anon key
- Service role key is longer and has different permissions

### "Still not working"
- Restart your terminal/IDE after adding
- Make sure the file is saved
- Check the file has no syntax errors

