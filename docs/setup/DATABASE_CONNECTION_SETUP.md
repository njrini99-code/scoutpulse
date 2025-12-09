# Database Connection Setup Guide

## 🔐 Setting Up Direct PostgreSQL Connection

### Step 1: Get Your Database Password

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** format connection string
4. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.blspsttgyxuoqhskpmrg.supabase.co:5432/postgres
   ```

### Step 2: Add to .env.local

Add this line to your `.env.local` file (replace `[YOUR-PASSWORD]` with actual password):

```env
# Direct PostgreSQL connection (for migrations, admin, testing)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.blspsttgyxuoqhskpmrg.supabase.co:5432/postgres
```

⚠️ **Security Note**: 
- Never commit `.env.local` to git
- The password is sensitive - keep it secure
- Use this only for development/admin tasks

### Step 3: Test the Connection

Run the connection test script:

```bash
npm run test:db
```

Or directly:

```bash
node scripts/test-db-connection-direct.js
```

## 📋 What the Connection Test Checks

1. ✅ Database connectivity
2. ✅ PostgreSQL version
3. ✅ Table count and list
4. ✅ Index count
5. ✅ RLS policies count
6. ✅ Sample data counts
7. ✅ Optimization indexes status
8. ✅ Query performance

## 🚀 Use Cases

### 1. Run Migrations Directly
```bash
# Using psql (if installed)
psql $DATABASE_URL -f supabase/migrations/002_query_optimization_indexes.sql
```

### 2. Test Queries
```bash
node scripts/test-db-connection-direct.js
```

### 3. Database Administration
- Connect with database tools (pgAdmin, DBeaver, etc.)
- Use the connection string in your preferred tool

## 🔧 Alternative: Using Supabase Client

For application code, continue using the Supabase client:

```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

The direct PostgreSQL connection is mainly for:
- Running migrations
- Database administration
- Performance monitoring
- Data analysis

## ⚠️ Important Notes

1. **RLS Policies**: Direct connections bypass RLS - use with caution
2. **Connection Pooling**: Supabase manages this automatically
3. **SSL Required**: Supabase requires SSL connections
4. **Rate Limits**: Be mindful of connection limits

## 🛠️ Troubleshooting

### "password authentication failed"
- Check your password in the connection string
- Get fresh password from Supabase Dashboard

### "ENOTFOUND" or "ECONNREFUSED"
- Verify the host: `db.blspsttgyxuoqhskpmrg.supabase.co`
- Check port: `5432`
- Ensure your IP is allowed (Supabase Dashboard → Settings → Database → Connection Pooling)

### "SSL required"
- The connection string should include SSL parameters
- Our test script handles this automatically

