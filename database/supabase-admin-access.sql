-- This function is used in RLS policies to check if a user has admin access
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION public.has_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 