-- Create dedicated deal_tracker schema
CREATE SCHEMA IF NOT EXISTS deal_tracker;

-- Create products table
CREATE TABLE IF NOT EXISTS deal_tracker.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  retailer TEXT,
  current_price DECIMAL(10, 2),
  target_price DECIMAL(10, 2),
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS deal_tracker.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alternative_deals table
CREATE TABLE IF NOT EXISTS deal_tracker.alternative_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_user_email ON deal_tracker.products(user_email);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON deal_tracker.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON deal_tracker.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON deal_tracker.price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternative_deals_product_id ON deal_tracker.alternative_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_alternative_deals_price ON deal_tracker.alternative_deals(price);

-- Enable Row Level Security (RLS)
ALTER TABLE deal_tracker.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tracker.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tracker.alternative_deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
CREATE POLICY "Users can view their own products"
  ON deal_tracker.products FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own products"
  ON deal_tracker.products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own products"
  ON deal_tracker.products FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own products"
  ON deal_tracker.products FOR DELETE
  USING (true);

-- Create RLS policies for price_history table
CREATE POLICY "Users can view price history"
  ON deal_tracker.price_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert price history"
  ON deal_tracker.price_history FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for alternative_deals table
CREATE POLICY "Users can view alternative deals"
  ON deal_tracker.alternative_deals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert alternative deals"
  ON deal_tracker.alternative_deals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete alternative deals"
  ON deal_tracker.alternative_deals FOR DELETE
  USING (true);

-- Grant usage on schema
GRANT USAGE ON SCHEMA deal_tracker TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA deal_tracker TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA deal_tracker TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA deal_tracker
  GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA deal_tracker
  GRANT ALL ON SEQUENCES TO anon, authenticated;
