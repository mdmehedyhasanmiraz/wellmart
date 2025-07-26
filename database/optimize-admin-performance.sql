-- Optimize Admin Panel Performance
-- This script adds indexes and optimizations for faster admin queries

-- Step 1: Add indexes for frequently queried columns
-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Orders table indexes (assuming user_orders table)
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);
CREATE INDEX IF NOT EXISTS idx_user_orders_created_at ON user_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_user_orders_total ON user_orders(total);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_home ON categories(is_home);
CREATE INDEX IF NOT EXISTS idx_categories_position ON categories(position);

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Step 2: Create a function for optimized dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_products BIGINT,
    total_users BIGINT,
    total_orders BIGINT,
    total_reviews BIGINT,
    total_sales NUMERIC,
    low_stock_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_orders) as total_orders,
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COALESCE(SUM(total), 0) FROM user_orders WHERE status = 'delivered') as total_sales,
        (SELECT COUNT(*) FROM products WHERE stock < 6 AND is_active = true) as low_stock_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function for low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    stock INTEGER,
    company_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock,
        c.name as company_name
    FROM products p
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE p.stock < 6 AND p.is_active = true
    ORDER BY p.stock ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function for recent notifications
CREATE OR REPLACE FUNCTION get_recent_notifications(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    type TEXT,
    message TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'order'::TEXT as type,
        'New order received'::TEXT as message,
        o.created_at
    FROM user_orders o
    WHERE o.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY o.created_at DESC
    LIMIT limit_count
    UNION ALL
    SELECT 
        'user'::TEXT as type,
        'New user registered'::TEXT as message,
        u.created_at
    FROM users u
    WHERE u.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY u.created_at DESC
    LIMIT limit_count
    UNION ALL
    SELECT 
        'lowstock'::TEXT as type,
        'Low stock alert'::TEXT as message,
        p.created_at
    FROM products p
    WHERE p.stock < 6 AND p.is_active = true
    ORDER BY p.stock ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify indexes were created
SELECT 
    'Indexes created successfully!' as status,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Step 6: Test the optimized functions
SELECT 
    'Testing optimized functions:' as info,
    total_products,
    total_users,
    total_orders,
    total_reviews,
    total_sales,
    low_stock_count
FROM get_dashboard_stats(); 