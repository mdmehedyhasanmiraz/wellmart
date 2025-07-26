-- Simple Migration: Update products table from manufacturer_id to company_id
-- This migration is for databases with RLS disabled

-- Step 1: Drop the existing foreign key constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_manufacturer_id_fkey;

-- Step 2: Rename the column from manufacturer_id to company_id
ALTER TABLE products RENAME COLUMN manufacturer_id TO company_id;

-- Step 3: Add the new foreign key constraint for company_id
ALTER TABLE products ADD CONSTRAINT products_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Step 4: Create an index on company_id for better performance
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- Step 5: Verify the migration was successful
SELECT 
    'Migration completed successfully!' as status,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'company_id'; 