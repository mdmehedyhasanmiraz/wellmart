-- Add flash_sale column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale BOOLEAN;

-- Create index for better performance when querying flash sale products
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON products(flash_sale) WHERE flash_sale = TRUE; 