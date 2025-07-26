-- Check and Sync Current User
-- This script will check if the current user exists and sync them if needed

-- Step 1: Check if we have a current authenticated user
SELECT 
    'Auth check:' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'User is authenticated'
        ELSE 'No authenticated user'
    END as auth_status;

-- Step 2: If user is authenticated, check if they exist in public.users
DO $$
DECLARE
    current_user_id UUID;
    user_exists BOOLEAN;
    user_record RECORD;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Check if user exists in public.users
        SELECT EXISTS(
            SELECT 1 FROM public.users WHERE id = current_user_id
        ) INTO user_exists;
        
        IF user_exists THEN
            RAISE NOTICE 'User % already exists in public.users table', current_user_id;
            
            -- Show user details
            SELECT * INTO user_record FROM public.users WHERE id = current_user_id;
            RAISE NOTICE 'User details: ID=%, Name=%, Email=%, Role=%', 
                user_record.id, user_record.name, user_record.email, user_record.role;
        ELSE
            RAISE NOTICE 'User % does not exist in public.users table. Creating...', current_user_id;
            
            -- Get user info from auth.users
            SELECT 
                id,
                email,
                COALESCE(raw_user_meta_data->>'name', email) as name,
                COALESCE(raw_user_meta_data->>'role', 'customer') as role
            INTO user_record
            FROM auth.users 
            WHERE id = current_user_id;
            
            -- Insert into public.users
            INSERT INTO public.users (id, name, email, role)
            VALUES (user_record.id, user_record.name, user_record.email, user_record.role);
            
            RAISE NOTICE 'User created successfully: ID=%, Name=%, Email=%, Role=%', 
                user_record.id, user_record.name, user_record.email, user_record.role;
        END IF;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;

-- Step 3: Show final user count
SELECT 
    'Final user count:' as info,
    COUNT(*) as total_users
FROM public.users;

-- Step 4: Show all users (if any)
SELECT 
    'All users in database:' as info,
    id,
    name,
    email,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC; 