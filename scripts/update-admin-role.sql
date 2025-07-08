-- Update user role to admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, name, email, role, created_at 
FROM public.users 
WHERE email = 'your-email@example.com'; 