-- Fix Admin Direct Access: Update RLS policies for direct Supabase access
-- This script ensures admin users can access products, categories, and companies directly

-- Step 1: Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user has admin role in their user_metadata
    RETURN (
        SELECT COALESCE(
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
            'customer'
        ) = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user has admin or manager role
    RETURN (
        SELECT COALESCE(
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
            'customer'
        ) IN ('admin', 'manager')
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing RLS policies on products table
DROP POLICY IF EXISTS "Allow public read access to active products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;

-- Step 4: Create new RLS policies for products table
-- Allow public read access to active products
CREATE POLICY "Allow public read access to active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Allow admin and manager users full access to products
CREATE POLICY "Allow admin full access to products" ON public.products
    FOR ALL USING (is_admin_or_manager());

-- Step 5: Drop existing RLS policies on categories table
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON public.categories;

-- Step 6: Create new RLS policies for categories table
-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories" ON public.categories
    FOR SELECT USING (true);

-- Allow admin and manager users full access to categories
CREATE POLICY "Allow admin full access to categories" ON public.categories
    FOR ALL USING (is_admin_or_manager());

-- Step 7: Drop existing RLS policies on companies table
DROP POLICY IF EXISTS "Allow public read access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON public.companies;

-- Step 8: Create new RLS policies for companies table
-- Allow public read access to companies
CREATE POLICY "Allow public read access to companies" ON public.companies
    FOR SELECT USING (true);

-- Allow admin and manager users full access to companies
CREATE POLICY "Allow admin full access to companies" ON public.companies
    FOR ALL USING (is_admin_or_manager());

-- Step 9: Verify the policies
SELECT 
    'RLS policies updated successfully!' as status,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('products', 'categories', 'companies') 
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 10: Test the policies
SELECT 
    'Testing direct access:' as info,
    'products' as table_name,
    COUNT(*) as row_count
FROM products
UNION ALL
SELECT 
    'Testing direct access:' as info,
    'categories' as table_name,
    COUNT(*) as row_count
FROM categories
UNION ALL
SELECT 
    'Testing direct access:' as info,
    'companies' as table_name,
    COUNT(*) as row_count
FROM companies;

-- Step 11: Show current user info
SELECT 
    'Current auth info:' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    is_admin_user() as is_admin,
    is_admin_or_manager() as is_admin_or_manager; 