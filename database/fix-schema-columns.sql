-- Add missing columns to products table
ALTER TABLE deal_tracker.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE deal_tracker.products ADD COLUMN IF NOT EXISTS category TEXT;

-- Rename created_at to checked_at in price_history
ALTER TABLE deal_tracker.price_history RENAME COLUMN created_at TO checked_at;
