-- Drop and Recreate Users Table with Auth Integration
-- This script will completely remove the existing users table and recreate it with proper auth.users sync

-- Step 1: Drop existing indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_phone;

-- Step 2: Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Step 3: Drop the users table (this will also drop all constraints)
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 4: Create the new users table with proper auth integration
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NULL,
    email TEXT NOT NULL,
    division TEXT NULL,
    district TEXT NULL,
    upazila TEXT NULL,
    street TEXT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Step 6: Create trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for proper auth integration
-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new users (handled by auth callback)
CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins and managers can view all users
CREATE POLICY "Admins and managers can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can update any user
CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Step 9: Create function to handle user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger to automatically create user record when auth.users gets new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Create function to sync existing auth users (run this once)
CREATE OR REPLACE FUNCTION sync_existing_auth_users()
RETURNS void AS $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN 
        SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'name', email) as name,
            COALESCE(raw_user_meta_data->>'role', 'customer') as role
        FROM auth.users
    LOOP
        -- Insert if not exists
        INSERT INTO public.users (id, name, email, role)
        VALUES (auth_user.id, auth_user.name, auth_user.email, auth_user.role)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Sync existing auth users
SELECT sync_existing_auth_users();

-- Step 13: Clean up the sync function
DROP FUNCTION sync_existing_auth_users();

-- Step 14: Verify the table structure
SELECT 
    'Users table recreated successfully!' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 15: Show constraints
SELECT 
    'Table constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 16: Show RLS policies
SELECT 
    'RLS policies:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 17: Show trigger
SELECT 
    'Triggers:' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public'
ORDER BY trigger_name; 