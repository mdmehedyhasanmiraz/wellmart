-- Safe Fix Migration Issue: Handle existing constraints and columns
-- This script will safely fix the database structure without conflicts

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

-- Step 2: Safely handle the products table structure
DO $$ 
BEGIN
    -- Check if company_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'company_id'
    ) THEN
        -- Add company_id column
        ALTER TABLE public.products ADD COLUMN company_id UUID;
        RAISE NOTICE 'Added company_id column to products table';
    ELSE
        RAISE NOTICE 'company_id column already exists in products table';
    END IF;
    
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_company_id_fkey' 
        AND table_name = 'products'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.products 
        ADD CONSTRAINT products_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for company_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for company_id';
    END IF;
    
    -- Check if index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_products_company_id'
    ) THEN
        -- Create index for better performance
        CREATE INDEX idx_products_company_id ON public.products(company_id);
        RAISE NOTICE 'Created index for company_id';
    ELSE
        RAISE NOTICE 'Index already exists for company_id';
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

-- Step 5: Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow public read access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON public.companies;

-- Create RLS policies for companies table
-- Allow public read access
CREATE POLICY "Allow public read access to companies" ON public.companies
  FOR SELECT USING (true);

-- Allow authenticated users to manage companies (for admin panel)
CREATE POLICY "Allow authenticated users to manage companies" ON public.companies
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Verify the structure
SELECT 
    'Database structure verified successfully!' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('products', 'companies') 
AND column_name IN ('company_id', 'id', 'name')
ORDER BY table_name, column_name;

-- Step 7: Show current constraints
SELECT 
    'Current constraints:' as info,
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'products' 
AND tc.constraint_name LIKE '%company_id%'; 