-- Quick Performance Check Script
-- Run this to see current performance issues

-- Check current indexes
SELECT 
    'Missing Critical Indexes:' as issue,
    'The following indexes are missing and causing slow queries:' as description;

-- Check if critical indexes exist
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_is_active') 
        THEN '❌ Missing: idx_products_is_active (critical for product filtering)'
        ELSE '✅ Found: idx_products_is_active'
    END as index_status
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_created_at') 
        THEN '❌ Missing: idx_products_created_at (critical for ordering)'
        ELSE '✅ Found: idx_products_created_at'
    END
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category_id') 
        THEN '❌ Missing: idx_products_category_id (critical for joins)'
        ELSE '✅ Found: idx_products_category_id'
    END
UNION ALL
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_company_id') 
        THEN '❌ Missing: idx_products_company_id (critical for joins)'
        ELSE '✅ Found: idx_products_company_id'
    END;

-- Check table sizes
SELECT 
    'Table Sizes:' as info,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM companies) as companies_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'products';

-- Check query performance (this will show actual execution time)
SELECT 
    'Performance Test Results:' as info,
    'Running test queries to measure current performance...' as status;

-- Test 1: Simple products query (should be < 100ms)
\timing on
SELECT COUNT(*) FROM products WHERE is_active = true;
\timing off

-- Test 2: Products with joins (should be < 300ms)
\timing on
SELECT 
    p.id,
    p.name,
    c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
LIMIT 5;
\timing off

-- Check for slow queries in the log (if available)
SELECT 
    'Recommendations:' as info,
    '1. Run optimize-product-performance.sql to add missing indexes' as step1,
    '2. Check your Supabase project region (closer = faster)' as step2,
    '3. Consider connection pooling for high traffic' as step3; 