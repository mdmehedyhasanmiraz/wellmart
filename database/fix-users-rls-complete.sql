-- Complete Fix for Users Table RLS Policies
-- This script provides a comprehensive solution for the infinite recursion issue

-- Step 1: Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Admins and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to manage users" ON public.users;

-- Step 2: Create a function to check if user is admin (avoids recursion)
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

-- Step 3: Create optimized RLS policies
-- Allow all authenticated users to read user data (for basic functionality)
CREATE POLICY "Allow authenticated read access" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own data
CREATE POLICY "Allow self update" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new users (handled by auth trigger)
CREATE POLICY "Allow user insert" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to perform all operations (using the function)
CREATE POLICY "Allow admin full access" ON public.users
    FOR ALL USING (is_admin_user());

-- Step 4: Create a function to get user role safely
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = user_id
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'customer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the policies
SELECT 
    'RLS policies created successfully!' as status,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 6: Test the policies
SELECT 
    'Testing users table access:' as info,
    COUNT(*) as user_count
FROM public.users;

-- Step 7: Show current user info
SELECT 
    'Current auth info:' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    is_admin_user() as is_admin; 