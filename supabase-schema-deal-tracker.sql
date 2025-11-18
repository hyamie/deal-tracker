-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS deal_tracker;

-- Set search path to deal_tracker schema
SET search_path TO deal_tracker;

-- Create products table
CREATE TABLE IF NOT EXISTS deal_tracker.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    current_price DECIMAL(10,2),
    target_price DECIMAL(10,2),
    image_url TEXT,
    category TEXT,
    retailer TEXT,
    last_checked TIMESTAMP WITH TIME ZONE,
    in_stock BOOLEAN DEFAULT true,
    user_email TEXT NOT NULL
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS deal_tracker.price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    url TEXT NOT NULL
);

-- Create alternative_deals table
CREATE TABLE IF NOT EXISTS deal_tracker.alternative_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES deal_tracker.products(id) ON DELETE CASCADE,
    retailer TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    url TEXT NOT NULL,
    found_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_user_email ON deal_tracker.products(user_email);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON deal_tracker.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_alternative_deals_product_id ON deal_tracker.alternative_deals(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION deal_tracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON deal_tracker.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON deal_tracker.products
    FOR EACH ROW EXECUTE FUNCTION deal_tracker.update_updated_at_column();
