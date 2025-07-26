-- Product Performance Optimization Script
-- This script adds indexes and optimizations to improve product loading speed

-- Step 1: Check current indexes
SELECT 
    'Current Indexes:' as info,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('products', 'categories', 'companies', 'reviews')
ORDER BY tablename, indexname;

-- Step 2: Add missing indexes for products table
-- These indexes are critical for the queries used in the application

-- Index for is_active filter (used in most product queries)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Index for created_at ordering (used in featured/recent products)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Index for price_regular ordering (used in top products)
CREATE INDEX IF NOT EXISTS idx_products_price_regular ON products(price_regular);

-- Index for category_id (used in joins and filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Index for company_id (used in joins and filtering)
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- Index for flash_sale filter
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON products(flash_sale);

-- Index for slug (used in product details)
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_price ON products(is_active, price_regular DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_flash ON products(is_active, flash_sale, created_at DESC);

-- Step 3: Add indexes for categories table
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Step 4: Add indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Step 5: Add indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Step 6: Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 7: Optimize table statistics
ANALYZE products;
ANALYZE categories;
ANALYZE companies;
ANALYZE reviews;
ANALYZE users;

-- Step 8: Verify indexes were created
SELECT 
    'Optimization Complete!' as status,
    'New indexes created for better performance' as message;

SELECT 
    'Products Table Indexes:' as table_info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'products'
ORDER BY indexname;

-- Step 9: Performance test queries
-- Test the optimized queries that match your application usage

-- Test 1: Featured products query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    p.id,
    p.name,
    p.price_regular,
    p.price_offer,
    c.name as category_name,
    c.slug as category_slug,
    comp.name as company_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN companies comp ON p.company_id = comp.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 6;

-- Test 2: Top products query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    p.id,
    p.name,
    p.price_regular,
    p.price_offer,
    c.name as category_name,
    c.slug as category_slug,
    comp.name as company_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN companies comp ON p.company_id = comp.id
WHERE p.is_active = true
ORDER BY p.price_regular DESC
LIMIT 8;

-- Test 3: Flash sale products query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    p.id,
    p.name,
    p.price_regular,
    p.price_offer,
    c.name as category_name,
    c.slug as category_slug,
    comp.name as company_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN companies comp ON p.company_id = comp.id
WHERE p.is_active = true AND p.flash_sale = true
ORDER BY p.created_at DESC
LIMIT 20;

-- Step 10: Check table sizes and row counts
SELECT 
    'Table Statistics:' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM companies) as companies_count,
    (SELECT COUNT(*) FROM reviews) as reviews_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('products', 'categories', 'companies', 'reviews'); 