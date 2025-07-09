-- Fix RLS policies that are causing 500 errors
-- Run this in your Supabase SQL editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Admins and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Create simple, working policies
-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own record
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all users (simple version)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Test the policies
-- This should work for any authenticated user
SELECT 
  id,
  name,
  email,
  role
FROM public.users 
WHERE id = auth.uid();

-- Check if your user exists and has admin role
SELECT 
  id,
  name,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN 'Has Admin Access'
    ELSE 'No Admin Access'
  END as access_status
FROM public.users 
WHERE email = 'mehedy.1872@gmail.com'; 