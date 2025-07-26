-- Drop and Recreate Products Table
-- This script will completely remove the existing products table and recreate it

-- Step 1: Drop existing indexes
DROP INDEX IF EXISTS idx_products_keywords;
DROP INDEX IF EXISTS idx_products_company_id;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_org_id;

-- Step 2: Drop existing triggers
DROP TRIGGER IF EXISTS set_updated_at ON products;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Step 3: Drop the products table (this will also drop all constraints)
DROP TABLE IF EXISTS public.products CASCADE;

-- Step 4: Create the new products table with correct structure
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    generic_name TEXT NULL,
    dosage_form TEXT NULL,
    pack_size TEXT NULL,
    sku TEXT NOT NULL,
    price_regular NUMERIC(10, 2) NOT NULL,
    price_offer NUMERIC(10, 2) NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[] NULL,
    description TEXT NOT NULL,
    category_id UUID NULL,
    company_id UUID NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    average_rating NUMERIC(3, 2) NULL DEFAULT 0,
    review_count INTEGER NULL DEFAULT 0,
    keywords TEXT[] NULL DEFAULT '{}'::text[],
    price_purchase NUMERIC(10, 2) NULL,
    video TEXT NULL,
    flash_sale BOOLEAN NULL DEFAULT false,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_sku_key UNIQUE (sku),
    CONSTRAINT products_slug_key UNIQUE (slug),
    CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_flash_sale ON public.products(flash_sale);
CREATE INDEX idx_products_keywords ON public.products USING GIN (keywords);

-- Step 6: Create trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_products_updated_at_column();

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Allow public read access to active products
CREATE POLICY "Allow public read access to active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage products (for admin panel)
CREATE POLICY "Allow authenticated users to manage products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Verify the table structure
SELECT 
    'Products table recreated successfully!' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Show constraints
SELECT 
    'Table constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name; 