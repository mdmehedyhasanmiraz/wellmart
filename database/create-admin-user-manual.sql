-- Manual admin user creation for Wellmart
-- Run this in your Supabase SQL Editor

-- Insert admin user for mehedy.1872@gmail.com
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
  '30b1ba78-360e-459d-a984-fcce8fbd9de8',
  'Mehedy Admin',
  'mehedy.1872@gmail.com',
  '',
  '',
  '',
  '',
  '',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Mehedy Admin',
  updated_at = NOW();

-- Verify the user was created
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'mehedy.1872@gmail.com'; 