-- Migration: Update products table from manufacturer_id to company_id
-- This migration renames the manufacturer_id column to company_id and updates the foreign key constraint

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_manufacturer_id_fkey;

-- Rename the column from manufacturer_id to company_id
ALTER TABLE products RENAME COLUMN manufacturer_id TO company_id;

-- Add the new foreign key constraint for company_id
ALTER TABLE products ADD CONSTRAINT products_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Create an index on company_id for better performance
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- Update any existing RLS policies that might reference manufacturer_id
-- (This will depend on your specific RLS policies)

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'company_id'; 