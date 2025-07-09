-- SQL script to create admin user for mehedy.1872@gmail.com
-- Run this in your Supabase SQL editor

-- First, let's check if the user already exists
SELECT * FROM public.users WHERE email = 'mehedy.1872@gmail.com';

-- If no user exists, create the admin user
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
  '30b1ba78-360e-459d-a984-fcce8fbd9de8', -- Your user ID from the diagnostic page
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
SELECT * FROM public.users WHERE email = 'mehedy.1872@gmail.com';

-- Check if the user has admin access
SELECT 
  id,
  name,
  email,
  role,
  CASE 
    WHEN role IN ('admin', 'manager') THEN 'Has Admin Access'
    ELSE 'No Admin Access'
  END as access_status
FROM public.users 
WHERE email = 'mehedy.1872@gmail.com'; 