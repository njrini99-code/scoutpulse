# How to Replace the Service Role Key

## 🔍 Current Status

The placeholder is still in your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
```

## ✅ Steps to Replace It

### Step 1: Get Your Service Role Key

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `blspsttgyxuoqhskpmrg`

2. **Navigate to API Settings**
   - Click **Settings** (gear icon) in left sidebar
   - Click **API** in the settings menu

3. **Find the Service Role Key**
   - Scroll to **Project API keys** section
   - You'll see two keys:
     - `anon` `public` - This is your anon key (you already have this)
     - `service_role` `secret` - This is what you need
   - Click **Reveal** next to `service_role` key
   - **Copy the entire key** (it's a very long JWT token)

### Step 2: Replace in .env.local

1. **Open `.env.local`** in your project root

2. **Find this line:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
   ```

3. **Replace it with:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here...
   ```
   (Replace with your actual key from Step 1)

4. **Save the file**

### Step 3: Verify It Worked

Run this command:
```bash
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

You should see:
- ✅ Your actual key (long JWT token starting with `eyJ`)
- ❌ NOT the placeholder text

### Step 4: Test It

```bash
npm run seed
```

If it works, you'll see seed data being created!

## ⚠️ Common Mistakes

1. **Using the wrong key**
   - ❌ Don't use the `anon` key
   - ✅ Use the `service_role` key

2. **Not copying the full key**
   - The key is very long (200+ characters)
   - Make sure you copy the entire thing

3. **Extra spaces**
   - ❌ `KEY = value` (with spaces)
   - ✅ `KEY=value` (no spaces)

4. **Not saving the file**
   - Make sure you save after editing

## 📝 Quick Check

After replacing, your `.env.local` should have:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc3BzdHRneXh1b3Foc2twbXJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzAwOSwiZXhwIjoyMDgwMjg5MDA5fQ.actual-key-continues...
```

Notice:
- Starts with `eyJ`
- Very long (200+ characters)
- No spaces around `=`
- Different from your anon key

## 🎯 Once You've Replaced It

Run this to verify:
```bash
node -e "require('dotenv').config({path:'.env.local'}); const k=process.env.SUPABASE_SERVICE_ROLE_KEY; console.log(k && k.length>100 && !k.includes('PASTE') ? '✅ Key looks good!' : '❌ Still needs replacement');"
```

