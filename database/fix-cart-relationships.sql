-- Fix Cart Relationships and Constraints
-- This script ensures proper foreign key relationships between user_carts and products tables

-- First, let's check if the user_carts table exists and has the correct structure
DO $$
BEGIN
    -- Check if user_carts table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_carts' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'user_carts table does not exist. Please run the supabase-cart-schema.sql first.';
    END IF;
    
    -- Check if products table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'products table does not exist. Please run the recreate-products-table.sql first.';
    END IF;
END $$;

-- Drop existing foreign key constraints if they exist (to recreate them properly)
ALTER TABLE public.user_carts DROP CONSTRAINT IF EXISTS user_carts_product_id_fkey;

-- Recreate the foreign key constraint with proper references
ALTER TABLE public.user_carts 
ADD CONSTRAINT user_carts_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Update the get_user_cart_total function to use correct column names
CREATE OR REPLACE FUNCTION get_user_cart_total(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    cart_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(uc.quantity * CASE 
        WHEN p.price_offer IS NOT NULL AND p.price_offer > 0 
        THEN p.price_offer 
        ELSE p.price_regular 
    END), 0) INTO cart_total
    FROM public.user_carts uc
    JOIN public.products p ON uc.product_id = p.id
    WHERE uc.user_id = user_uuid;
    
    RETURN cart_total;
END;
$$ LANGUAGE plpgsql;

-- Create a new function to get cart with product details (for better performance)
CREATE OR REPLACE FUNCTION get_user_cart_with_products(user_uuid UUID)
RETURNS TABLE (
    cart_id UUID,
    user_id UUID,
    product_id UUID,
    quantity INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    product_name TEXT,
    product_slug TEXT,
    price_regular NUMERIC,
    price_offer NUMERIC,
    image_urls TEXT[],
    stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as cart_id,
        uc.user_id,
        uc.product_id,
        uc.quantity,
        uc.created_at,
        uc.updated_at,
        p.name as product_name,
        p.slug as product_slug,
        p.price_regular,
        p.price_offer,
        p.image_urls,
        p.stock
    FROM public.user_carts uc
    JOIN public.products p ON uc.product_id = p.id
    WHERE uc.user_id = user_uuid
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Verify the foreign key constraint
SELECT 
    'Foreign key constraint verification:' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_carts'
    AND kcu.column_name = 'product_id';

-- Show the updated functions
SELECT 
    'Updated functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('get_user_cart_count', 'get_user_cart_total', 'get_user_cart_with_products')
ORDER BY routine_name;

-- Test the cart total function with a sample user (if any exists)
DO $$
DECLARE
    sample_user_id UUID;
    cart_total DECIMAL;
BEGIN
    -- Get a sample user ID
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        SELECT get_user_cart_total(sample_user_id) INTO cart_total;
        RAISE NOTICE 'Sample cart total for user %: %', sample_user_id, cart_total;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$; 