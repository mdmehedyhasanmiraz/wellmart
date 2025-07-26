-- Fix Migration Issue: Create companies table and fix products table
-- This script will fix the database structure after the failed migration

-- Step 1: Create the companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Add company_id column to products table if it doesn't exist
DO $$ 
BEGIN
    -- Check if company_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'company_id'
    ) THEN
        -- Add company_id column
        ALTER TABLE public.products ADD COLUMN company_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.products 
        ADD CONSTRAINT products_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
        
        RAISE NOTICE 'Added company_id column to products table';
    ELSE
        RAISE NOTICE 'company_id column already exists in products table';
    END IF;
END $$;

-- Step 3: Create trigger for companies table updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON public.companies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_companies_updated_at_column();

-- Step 4: Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for companies table
-- Allow public read access
CREATE POLICY "Allow public read access to companies" ON public.companies
  FOR SELECT USING (true);

-- Allow authenticated users to manage companies (for admin panel)
CREATE POLICY "Allow authenticated users to manage companies" ON public.companies
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Verify the structure
SELECT 
    'Database structure fixed successfully!' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('products', 'companies') 
AND column_name IN ('company_id', 'id', 'name')
ORDER BY table_name, column_name; 