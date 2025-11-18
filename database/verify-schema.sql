-- Verify deal_tracker schema exists and has tables
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'deal_tracker';

-- List all tables in deal_tracker schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'deal_tracker';

-- Check columns in products table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'deal_tracker'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Check columns in price_history table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'deal_tracker'
  AND table_name = 'price_history'
ORDER BY ordinal_position;

-- Check columns in alternative_deals table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'deal_tracker'
  AND table_name = 'alternative_deals'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'deal_tracker';
