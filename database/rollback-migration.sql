-- Rollback Migration: Undo the manufacturer to company changes
-- Use this if you need to revert the changes

-- Step 1: Drop the foreign key constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_company_id_fkey;

-- Step 2: Drop the index if it exists
DROP INDEX IF EXISTS idx_products_company_id;

-- Step 3: Rename the column back from company_id to manufacturer_id
ALTER TABLE products RENAME COLUMN company_id TO manufacturer_id;

-- Step 4: Add back the original foreign key constraint (if manufacturers table exists)
-- ALTER TABLE products ADD CONSTRAINT products_manufacturer_id_fkey 
-- FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL;

-- Step 5: Create index on manufacturer_id
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON products(manufacturer_id);

-- Step 6: Verify the rollback
SELECT 
    'Rollback completed!' as status,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'manufacturer_id'; 