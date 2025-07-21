-- Add unique index on phone field for phone-based authentication
-- This migration should be run in production to support SMS OTP login

-- Check if index already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_phone'
    ) THEN
        -- Create unique index on phone field (only for non-null values)
        CREATE UNIQUE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
        
        RAISE NOTICE 'Phone index created successfully';
    ELSE
        RAISE NOTICE 'Phone index already exists';
    END IF;
END $$; 