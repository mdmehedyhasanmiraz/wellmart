-- Add keywords column to products table
-- This column will store an array of keywords for SEO and search purposes

ALTER TABLE public.products 
ADD COLUMN keywords TEXT[] DEFAULT '{}';

-- Add an index on keywords for better search performance
CREATE INDEX idx_products_keywords ON public.products USING GIN (keywords);

-- Add a comment to document the column
COMMENT ON COLUMN public.products.keywords IS 'Array of keywords for SEO and search functionality'; 