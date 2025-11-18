# Database Schema Documentation

## Current Schema: Public (Supabase Default)

All tables are in the `public` schema following Supabase best practices.

## Active Migration

**Current:** `migrate-to-public-schema.sql` - ✅ Applied
- Migrated from `deal_tracker` schema to `public` schema
- Fixes PGRST106 error
- Includes RLS policies
- Verified with 3 products, 8 price records

## Tables

### products
Main product tracking table
```sql
- id (UUID, PK)
- created_at (timestamp)
- updated_at (timestamp)
- name (text)
- url (text)
- current_price (decimal)
- target_price (decimal)
- image_url (text)
- category (text)
- retailer (text)
- last_checked (timestamp)
- in_stock (boolean)
- user_email (text)
```

### price_history
Historical price tracking
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products)
- price (decimal)
- checked_at (timestamp)
- url (text)
```

### alternative_deals
Alternative vendor pricing
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products)
- retailer (text)
- price (decimal)
- url (text)
- found_at (timestamp)
```

## Archived Migrations

Old migrations in this directory are kept for reference but should not be used:
- `create-deal-tracker-schema.sql` - Old schema creation
- `fresh-deal-tracker-schema.sql` - Old schema
- `fix-schema-columns.sql` - Column fixes (superseded)
- `safe-schema-fix.sql` - Safe column fixes (superseded)
- `complete-schema-fix.sql` - Complete fix (superseded)
- `verify-schema.sql` - Verification queries

## RLS Policies

Current policies allow all operations (development mode).

For production:
- Restrict access based on `user_email` column
- Add authentication via Supabase Auth
- Update policies to match authenticated user

## Indexes

Performance indexes created:
- `idx_products_user_email` - Filter by user
- `idx_products_created_at` - Sort by creation date
- `idx_price_history_product_id` - Join performance
- `idx_price_history_checked_at` - Time-based queries
- `idx_alternative_deals_product_id` - Join performance
