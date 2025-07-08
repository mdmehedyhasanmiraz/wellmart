-- Fix RLS policies for user creation
-- Run this in your Supabase SQL editor

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;

-- Create a more permissive insert policy
CREATE POLICY "Allow insert for new users" ON public.users
  FOR INSERT WITH CHECK (true); -- Allow any authenticated user to insert

-- Also create a policy to allow users to insert their own record
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to safely create admin users
CREATE OR REPLACE FUNCTION create_admin_user(
  user_id UUID,
  user_name TEXT,
  user_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    division,
    district,
    upazila,
    street,
    role
  ) VALUES (
    user_id,
    user_name,
    user_email,
    '',
    '',
    '',
    '',
    '',
    'admin'
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    name = user_name,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_admin_user(UUID, TEXT, TEXT) TO authenticated;

-- Test the function (replace with your actual user ID)
-- SELECT create_admin_user('30b1ba78-360e-459d-a984-fcce8fbd9de8', 'Mehedy Admin', 'mehedy.1872@gmail.com'); 