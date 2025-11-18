-- Safe schema fix that handles already-applied changes

-- 1. Add missing columns to products table
ALTER TABLE deal_tracker.products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE deal_tracker.products
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Add missing found_at column to alternative_deals
ALTER TABLE deal_tracker.alternative_deals
  ADD COLUMN IF NOT EXISTS found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Fix price_history column name (only if it still has created_at)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'deal_tracker'
    AND table_name = 'price_history'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE deal_tracker.price_history RENAME COLUMN created_at TO checked_at;
  END IF;
END $$;

-- 4. Update indexes to match new column names
DROP INDEX IF EXISTS deal_tracker.idx_price_history_created_at;
CREATE INDEX IF NOT EXISTS idx_price_history_checked_at
  ON deal_tracker.price_history(checked_at DESC);
