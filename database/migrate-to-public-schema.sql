-- Migration: Move deal-tracker tables from deal_tracker schema to public schema
-- This fixes the PGRST106 error by using Supabase's default 'public' schema

-- 1. Create tables in public schema
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  current_price DECIMAL(10, 2),
  target_price DECIMAL(10, 2),
  image_url TEXT,
  category TEXT,
  retailer TEXT,
  last_checked TIMESTAMP WITH TIME ZONE,
  in_stock BOOLEAN DEFAULT true,
  user_email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.alternative_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT NOT NULL,
  found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_user_email ON public.products(user_email);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_checked_at ON public.price_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternative_deals_product_id ON public.alternative_deals(product_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_deals ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (allow authenticated users to access their own data)
-- For now, allow all operations since we're using service role
-- In production, you'd want stricter policies based on user_email

-- Products policies
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
CREATE POLICY "Allow all operations on products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- Price history policies
DROP POLICY IF EXISTS "Allow all operations on price_history" ON public.price_history;
CREATE POLICY "Allow all operations on price_history" ON public.price_history
  FOR ALL USING (true) WITH CHECK (true);

-- Alternative deals policies
DROP POLICY IF EXISTS "Allow all operations on alternative_deals" ON public.alternative_deals;
CREATE POLICY "Allow all operations on alternative_deals" ON public.alternative_deals
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Migration: Copy data from deal_tracker schema if it exists
DO $$
BEGIN
  -- Check if deal_tracker schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'deal_tracker') THEN

    -- Copy products
    INSERT INTO public.products (id, created_at, updated_at, name, url, current_price, target_price, image_url, category, retailer, last_checked, in_stock, user_email)
    SELECT id, created_at, COALESCE(updated_at, created_at), name, url, current_price, target_price, image_url, category, retailer, last_checked, in_stock, user_email
    FROM deal_tracker.products
    ON CONFLICT (id) DO NOTHING;

    -- Copy price_history (handle column name change from created_at to checked_at)
    INSERT INTO public.price_history (id, product_id, price, checked_at, url)
    SELECT id, product_id, price,
      COALESCE(
        (SELECT checked_at FROM deal_tracker.price_history ph WHERE ph.id = deal_tracker.price_history.id),
        (SELECT created_at FROM deal_tracker.price_history ph WHERE ph.id = deal_tracker.price_history.id),
        NOW()
      ) as checked_at,
      url
    FROM deal_tracker.price_history
    ON CONFLICT (id) DO NOTHING;

    -- Copy alternative_deals
    INSERT INTO public.alternative_deals (id, product_id, retailer, price, url, found_at)
    SELECT id, product_id, retailer, price, url, COALESCE(found_at, NOW())
    FROM deal_tracker.alternative_deals
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Data migration completed from deal_tracker schema to public schema';
  ELSE
    RAISE NOTICE 'deal_tracker schema not found - skipping data migration';
  END IF;
END $$;

-- 6. Verify the migration
SELECT
  'products' as table_name,
  COUNT(*) as row_count
FROM public.products
UNION ALL
SELECT
  'price_history' as table_name,
  COUNT(*) as row_count
FROM public.price_history
UNION ALL
SELECT
  'alternative_deals' as table_name,
  COUNT(*) as row_count
FROM public.alternative_deals;
