# Deal Tracker - Database Configuration
**Last Updated**: 2025-11-17

## Current Setup

**Supabase Project**: apps-hub (shared with Discord Trading Bot)
**Schema**: `deal_tracker`
**Compute**: MICRO (shared)
**Connection**: Via Next.js environment variables

---

## Important Notes

⚠️ **This project uses a SCHEMA in a shared Supabase project!**

All tables are in: `deal_tracker.*`

Example:
- ✅ `deal_tracker.products`
- ✅ `deal_tracker.price_history`
- ❌ ~~`public.products`~~ (wrong schema)

---

## Database Schema

**Schema Name**: `deal_tracker`

**Tables**:
1. `products` - Tracked products with current prices
2. `price_history` - Historical price data for trend analysis
3. `alternative_deals` - Better prices from other retailers

**Relationships**:
- `price_history.product_id` → `products.id` (CASCADE DELETE)
- `alternative_deals.product_id` → `products.id` (CASCADE DELETE)

---

## Connection Configuration

### Environment Variables (.env.local)

```bash
# Supabase connection (apps-hub project)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# CRITICAL: Schema configuration
NEXT_PUBLIC_SUPABASE_SCHEMA=deal_tracker

# Your settings
NEXT_PUBLIC_USER_EMAIL=your_email@example.com
CRON_SECRET=your_random_secret
```

**Important**: `NEXT_PUBLIC_SUPABASE_SCHEMA=deal_tracker` tells the Supabase client which schema to use.

---

## Next.js Configuration

**File**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'deal_tracker'
  }
})
```

**Key Point**: The `db.schema` option routes all queries to the `deal_tracker` schema automatically.

---

## Usage Example

With schema configured, you can use tables directly:

```typescript
// This queries deal_tracker.products automatically
const { data } = await supabase
  .from('products')
  .select('*')
```

Behind the scenes: `SELECT * FROM deal_tracker.products`

---

## Shared Project Details

**apps-hub Project Contains**:
- `discord_trading` schema - Discord Trading Bot
- `deal_tracker` schema - Deal Tracker (this app)
- (future schemas as needed)

**Benefits**:
- Share one MICRO compute across multiple apps
- Total cost: $10/month for all apps
- Each schema is isolated (can't see other schemas' data)

**Isolation**:
- Deal Tracker queries ONLY see `deal_tracker.*` tables
- Trading Bot queries ONLY see `discord_trading.*` tables
- Complete data separation

---

## Schema Details

### products Table

```sql
CREATE TABLE deal_tracker.products (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    current_price DECIMAL(10,2),
    target_price DECIMAL(10,2),
    image_url TEXT,
    category TEXT,
    retailer TEXT,
    last_checked TIMESTAMPTZ,
    in_stock BOOLEAN DEFAULT true,
    user_email TEXT NOT NULL
);
```

### price_history Table

```sql
CREATE TABLE deal_tracker.price_history (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    checked_at TIMESTAMPTZ,
    url TEXT NOT NULL
);
```

### alternative_deals Table

```sql
CREATE TABLE deal_tracker.alternative_deals (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
    retailer TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    url TEXT NOT NULL,
    found_at TIMESTAMPTZ
);
```

---

## Row Level Security (RLS)

**Status**: Enabled on all tables
**Current Policy**: Allow all for authenticated users

**Future**: Can tighten to filter by `user_email` for multi-user support:

```sql
CREATE POLICY "Users see own products"
ON deal_tracker.products
FOR SELECT
USING (user_email = auth.jwt()->>'email');
```

---

## Troubleshooting

### "Table 'products' does not exist"

**Cause**: Schema not configured in Supabase client
**Fix**:
1. Check `.env.local` has `NEXT_PUBLIC_SUPABASE_SCHEMA=deal_tracker`
2. Verify Supabase client config includes `db: { schema: 'deal_tracker' }`

### Can't Insert/Update Data

**Cause**: Missing RLS policy or wrong schema
**Fix**:
1. Check RLS policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'deal_tracker'`
2. Verify schema in query: `SET search_path TO deal_tracker, public;`

### Seeing Trading Bot Data

**This should never happen!** Schemas are isolated.

If you see Trading Bot tables:
1. Check `NEXT_PUBLIC_SUPABASE_SCHEMA=deal_tracker` (not `discord_trading`)
2. Restart dev server after env changes

---

## Vercel Deployment

**Environment Variables to Set in Vercel**:
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `NEXT_PUBLIC_SUPABASE_SCHEMA` ← Don't forget this!
4. `NEXT_PUBLIC_USER_EMAIL`
5. `CRON_SECRET`

**Deployment Steps**:
1. Push to GitHub
2. Connect to Vercel
3. Add all environment variables
4. Deploy
5. Test that products can be added/viewed

---

## Related Documentation

- Apps-hub overview: `C:/ClaudeAgents/kb/topics/apps-hub-supabase-project.md`
- Schema templates: `C:/ClaudeAgents/templates/supabase-schema-template/`
- Original schema: `supabase-schema.sql` (if it exists in project)

---

**Status**: ✅ Active
**Deployment**: Vercel (pending)
**Last Verified**: 2025-11-17
