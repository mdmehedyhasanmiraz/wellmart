-- Optimize Product Page Performance
-- This script adds indexes and optimizations for faster product page queries

-- Step 1: Add indexes for product page queries
-- Index for product lookup by slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Composite index for active products by slug
CREATE INDEX IF NOT EXISTS idx_products_slug_active ON products(slug, is_active);

-- Index for reviews by product_id and status
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews(product_id, status);

-- Index for reviews by user_id and product_id
CREATE INDEX IF NOT EXISTS idx_reviews_user_product ON reviews(user_id, product_id);

-- Index for categories by slug
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Index for companies by id (for joins)
CREATE INDEX IF NOT EXISTS idx_companies_id ON companies(id);

-- Step 2: Create a function for optimized product details
CREATE OR REPLACE FUNCTION get_product_details(product_slug TEXT)
RETURNS TABLE (
    product_data JSONB,
    reviews_data JSONB,
    user_review_data JSONB
) AS $$
DECLARE
    product_record RECORD;
    reviews_array JSONB;
    user_review_record RECORD;
    current_user_id UUID;
BEGIN
    -- Get current user ID (if authenticated)
    current_user_id := auth.uid();
    
    -- Get product with category and company info
    SELECT 
        p.*,
        jsonb_build_object(
            'name', c.name,
            'slug', c.slug
        ) as category,
        jsonb_build_object(
            'name', comp.name
        ) as company
    INTO product_record
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN companies comp ON p.company_id = comp.id
    WHERE p.slug = product_slug AND p.is_active = true;
    
    -- Get approved reviews
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'created_at', r.created_at,
            'status', r.status
        )
    ) INTO reviews_array
    FROM reviews r
    WHERE r.product_id = product_record.id AND r.status = 'approved'
    ORDER BY r.created_at DESC;
    
    -- Get user's review if authenticated
    IF current_user_id IS NOT NULL THEN
        SELECT 
            r.id,
            r.rating,
            r.comment,
            r.created_at,
            r.status
        INTO user_review_record
        FROM reviews r
        WHERE r.product_id = product_record.id AND r.user_id = current_user_id;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT
        to_jsonb(product_record) as product_data,
        COALESCE(reviews_array, '[]'::jsonb) as reviews_data,
        CASE 
            WHEN user_review_record.id IS NOT NULL THEN to_jsonb(user_review_record)
            ELSE NULL
        END as user_review_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function for product search optimization
CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT,
    category_filter TEXT DEFAULT NULL,
    company_filter TEXT DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    price_regular NUMERIC,
    price_offer NUMERIC,
    stock INTEGER,
    image_urls TEXT[],
    category_name TEXT,
    company_name TEXT,
    total_count BIGINT
) AS $$
DECLARE
    total_records BIGINT;
BEGIN
    -- Get total count for pagination
    SELECT COUNT(*)
    INTO total_records
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN companies comp ON p.company_id = comp.id
    WHERE p.is_active = true
        AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
        AND (category_filter IS NULL OR c.slug = category_filter)
        AND (company_filter IS NULL OR comp.name = company_filter)
        AND (min_price IS NULL OR p.price_regular >= min_price)
        AND (max_price IS NULL OR p.price_regular <= max_price);
    
    -- Return products with total count
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.price_regular,
        p.price_offer,
        p.stock,
        p.image_urls,
        c.name as category_name,
        comp.name as company_name,
        total_records
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN companies comp ON p.company_id = comp.id
    WHERE p.is_active = true
        AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
        AND (category_filter IS NULL OR c.slug = category_filter)
        AND (company_filter IS NULL OR comp.name = company_filter)
        AND (min_price IS NULL OR p.price_regular >= min_price)
        AND (max_price IS NULL OR p.price_regular <= max_price)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Add full-text search index for product search
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Step 5: Create a function for related products
CREATE OR REPLACE FUNCTION get_related_products(
    product_id UUID,
    limit_count INTEGER DEFAULT 4
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    price_regular NUMERIC,
    price_offer NUMERIC,
    image_urls TEXT[],
    category_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.price_regular,
        p.price_offer,
        p.image_urls,
        c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
        AND p.id != product_id
        AND p.category_id = (SELECT category_id FROM products WHERE id = product_id)
    ORDER BY p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 