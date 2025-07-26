-- Diagnostic Script: Check current database state
-- Run this to see what's currently in your database

-- Check if companies table exists
SELECT 
    'Companies table check:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'companies' AND table_schema = 'public'
    ) as companies_table_exists;

-- Check products table structure
SELECT 
    'Products table columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on products table
SELECT 
    'Products table constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products' 
AND tc.constraint_type = 'FOREIGN KEY';

-- Check indexes on products table
SELECT 
    'Products table indexes:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'products';

-- Check if there are any data in the tables
SELECT 
    'Table row counts:' as info,
    'products' as table_name,
    COUNT(*) as row_count
FROM products
UNION ALL
SELECT 
    'Table row counts:' as info,
    'companies' as table_name,
    COUNT(*) as row_count
FROM companies; 