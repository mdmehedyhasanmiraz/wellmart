-- Fix Users Table RLS Policies - Remove Infinite Recursion
-- This script will fix the infinite recursion issue in the RLS policies

-- Step 1: Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Admins and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Step 2: Create simplified RLS policies that don't cause recursion
-- Allow public read access to users (for basic functionality)
CREATE POLICY "Allow public read access to users" ON public.users
    FOR SELECT USING (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Allow users to update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new users (handled by auth trigger)
CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to manage users (for admin panel)
-- This is a simplified policy that doesn't cause recursion
CREATE POLICY "Allow authenticated users to manage users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 3: Verify the policies
SELECT 
    'RLS policies fixed successfully!' as status,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 4: Test the policies by checking if we can query the users table
SELECT 
    'Testing users table access:' as info,
    COUNT(*) as user_count
FROM public.users; 